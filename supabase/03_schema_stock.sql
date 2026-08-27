-- =====================================================================
-- COMPLÉMENT AU SCHÉMA — Module Stock / Patrimoine matériel
-- À exécuter après 01_schema_finance.sql et 02_schema_enseignement.sql.
-- Nouveau rôle : MAGASINIER (gestion des articles et mouvements de stock).
-- =====================================================================

create type sens_mouvement_stock as enum ('entree', 'sortie');
create type motif_sortie_stock as enum ('distribution_classe', 'distribution_service', 'consommation', 'perte_casse', 'peremption', 'autre');

-- ---------------------------------------------------------------------
-- ARTICLES
-- ---------------------------------------------------------------------
create table categorie_article (
    id     uuid primary key default gen_random_uuid(),
    code   text unique not null,   -- ex: FOURNITURE, ENTRETIEN, MOBILIER
    nom    text not null
);

create table article (
    id                 uuid primary key default gen_random_uuid(),
    code               text unique not null,
    nom                text not null,          -- ex: 'Craie blanche', 'Cahier 96 pages', 'Lave-vitre'
    categorie_id       uuid not null references categorie_article(id),
    unite_mesure       text not null,           -- 'pièce', 'carton', 'litre', 'paquet'...
    seuil_alerte       numeric(10,2) not null default 0,  -- alerte si stock <= ce seuil
    statut             text not null default 'actif' check (statut in ('actif', 'inactif')),
    created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MOUVEMENTS DE STOCK (traçabilité complète, comme la caisse)
-- ---------------------------------------------------------------------
create table mouvement_stock (
    id                 uuid primary key default gen_random_uuid(),
    article_id         uuid not null references article(id),
    sens               sens_mouvement_stock not null,
    quantite           numeric(10,2) not null check (quantite > 0),

    -- Entrée : lien optionnel vers la dépense qui a financé l'achat —
    -- pour ne jamais dissocier "argent sorti" et "matériel entré".
    depense_id         uuid references depense(id),
    fournisseur        text,

    -- Sortie : à qui/quoi c'est distribué, et pourquoi.
    motif_sortie       motif_sortie_stock,
    classe_id          uuid references classe(id),      -- si distribution à une classe
    beneficiaire       text,                              -- si distribution à un service/personne

    motif              text,               -- commentaire libre (obligatoire si perte/casse)
    utilisateur_id     uuid not null references utilisateur(id),
    date_mouvement     timestamptz not null default now(),

    check (
        (sens = 'entree' and motif_sortie is null)
        or (sens = 'sortie' and motif_sortie is not null)
    )
);

-- Solde de stock par article — jamais une colonne stockée, toujours calculé,
-- même logique que `solde_fonds` pour la caisse.
create view solde_stock as
select a.id as article_id, a.code, a.nom, a.unite_mesure, a.seuil_alerte, c.nom as categorie,
       coalesce(sum(case when m.sens = 'entree' then m.quantite else 0 end), 0)
     - coalesce(sum(case when m.sens = 'sortie' then m.quantite else 0 end), 0) as quantite_disponible
from article a
join categorie_article c on c.id = a.categorie_id
left join mouvement_stock m on m.article_id = a.id
group by a.id, a.code, a.nom, a.unite_mesure, a.seuil_alerte, c.nom;

-- Garde-fou : une sortie ne peut jamais rendre le stock négatif.
create or replace function verifier_stock_suffisant() returns trigger as $$
declare v_disponible numeric(10,2);
begin
    if new.sens = 'sortie' then
        select quantite_disponible into v_disponible from solde_stock where article_id = new.article_id;
        if v_disponible is null or v_disponible < new.quantite then
            raise exception 'Stock insuffisant pour l''article % (disponible: %, demandé: %)',
                new.article_id, coalesce(v_disponible, 0), new.quantite;
        end if;
    end if;
    return new;
end; $$ language plpgsql;

create trigger trg_verif_stock
    before insert on mouvement_stock
    for each row execute function verifier_stock_suffisant();

-- ---------------------------------------------------------------------
-- RÔLE
-- ---------------------------------------------------------------------
insert into role (code, nom) values ('MAGASINIER', 'Magasinier / Gestionnaire de stock')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table article enable row level security;
alter table categorie_article enable row level security;
alter table mouvement_stock enable row level security;

-- MAGASINIER : gère les articles et catégories
create policy article_magasinier on article
    for all using (role_courant() = 'MAGASINIER');
create policy categorie_article_magasinier on categorie_article
    for all using (role_courant() = 'MAGASINIER');

-- Lecture large pour supervision (le stock est un patrimoine de l'école,
-- le Directeur et l'Auditeur doivent pouvoir le consulter sans le modifier)
create policy article_lecture_direction on article
    for select using (role_courant() in ('DIRECTEUR', 'AUDITEUR', 'RESP_FINANCIER'));
create policy categorie_article_lecture on categorie_article
    for select using (true);

-- Mouvements : le MAGASINIER crée, jamais de modification/suppression a
-- posteriori (immutabilité, comme les recettes/dépenses) — seule une
-- écriture d'ajustement (nouvel mouvement) peut corriger une erreur.
create policy mouvement_stock_creation on mouvement_stock
    for insert with check (role_courant() = 'MAGASINIER' and utilisateur_id = auth.uid());
create policy mouvement_stock_lecture_magasinier on mouvement_stock
    for select using (role_courant() = 'MAGASINIER');
create policy mouvement_stock_lecture_direction on mouvement_stock
    for select using (role_courant() in ('DIRECTEUR', 'AUDITEUR', 'RESP_FINANCIER'));

-- ---------------------------------------------------------------------
-- DONNÉES DE BASE
-- ---------------------------------------------------------------------
insert into categorie_article (code, nom) values
    ('FOURNITURE', 'Fournitures scolaires'),
    ('ENTRETIEN', 'Produits d''entretien'),
    ('MOBILIER', 'Mobilier et équipement'),
    ('BUREAU', 'Fournitures de bureau')
on conflict (code) do nothing;
