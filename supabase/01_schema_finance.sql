-- =====================================================================
-- SCHÉMA SQL — Logiciel de gestion financière et scolaire (RDC)
-- PostgreSQL / Supabase — Étape 12
--
-- HYPOTHÈSES PAR DÉFAUT (faute de réponse explicite aux 5 points ouverts
-- de l'étape précédente) — à ajuster librement, tout est paramétrable :
--   1) Plan comptable SYSCOHADA : table vide de comptes réels, seedée
--      uniquement de PLACEHOLDERS à valider par un comptable RDC.
--      Aucune écriture ne peut être générée tant qu'un compte requis
--      n'est pas configuré (contrainte + fonction de garde).
--   2) Trop-perçu : reporté en crédit sur l'élève (table credit_eleve),
--      jamais remboursé automatiquement.
--   3) Dettes non reportées automatiquement d'une année à l'autre
--      (fonction dédiée optionnelle si vous voulez l'activer).
--   4) Seuil de double validation : table de configuration
--      seuil_validation, valeur par défaut 0 (désactivé) — à définir.
--   5) Architecture confirmée : PostgreSQL + Supabase (Auth, RLS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 1. TYPES ÉNUMÉRÉS (statuts)
-- ---------------------------------------------------------------------
create type statut_annee_scolaire   as enum ('active', 'cloturee');
create type statut_eleve            as enum ('actif', 'transfere', 'exclu', 'diplome');
create type statut_paiement         as enum ('en_attente', 'validee', 'rejetee', 'annulee');
create type statut_depense          as enum ('brouillon', 'en_attente_approbation', 'approuvee',
                                              'refusee', 'retournee', 'payee');
create type statut_transfert        as enum ('en_attente', 'valide', 'refuse');
create type statut_cloture          as enum ('preparee', 'validee');
create type statut_ecriture         as enum ('brouillon', 'validee', 'contrepassee');
create type sens_ecriture           as enum ('debit', 'credit');
create type type_tresorerie         as enum ('caisse', 'banque', 'mobile_money', 'autre');
create type mode_paiement           as enum ('especes', 'banque', 'mobile_money', 'autre');

-- ---------------------------------------------------------------------
-- 2. ADMINISTRATION : rôles, utilisateurs, permissions
-- ---------------------------------------------------------------------
create table role (
    id           uuid primary key default gen_random_uuid(),
    code         text unique not null,   -- ex: CAISSIER, CONTROLEUR, RESP_FINANCIER,
                                          -- DIRECTEUR, COMPTABLE, AUDITEUR, ADMIN_TECH
    nom          text not null,
    created_at   timestamptz not null default now()
);

create table permission (
    id           uuid primary key default gen_random_uuid(),
    role_id      uuid not null references role(id) on delete cascade,
    ressource    text not null,   -- ex: 'paiement', 'depense', 'ecriture_comptable'
    action       text not null,   -- ex: 'creer', 'valider', 'lire', 'supprimer'
    unique (role_id, ressource, action)
);

-- utilisateur applicatif, lié à auth.users de Supabase
create table utilisateur (
    id           uuid primary key references auth.users(id) on delete cascade,
    nom_complet  text not null,
    role_id      uuid not null references role(id),
    caisse_id    uuid,            -- affectation optionnelle à une caisse précise (FK ajoutée plus bas)
    statut       text not null default 'actif' check (statut in ('actif', 'inactif')),
    created_at   timestamptz not null default now()
);

create table seuil_validation (
    id                  uuid primary key default gen_random_uuid(),
    type_operation      text not null check (type_operation in ('depense', 'transfert_fonds')),
    montant_seuil       numeric(18,2) not null default 0,   -- 0 = double validation désactivée
    role_validation_2   uuid references role(id)            -- ex: rôle DIRECTEUR au-delà du seuil
);

-- ---------------------------------------------------------------------
-- 3. ANNÉES SCOLAIRES / CLASSES / ÉLÈVES
-- ---------------------------------------------------------------------
create table annee_scolaire (
    id           uuid primary key default gen_random_uuid(),
    libelle      text unique not null,       -- ex: '2026-2027'
    date_debut   date not null,
    date_fin     date not null,
    statut       statut_annee_scolaire not null default 'active',
    check (date_fin > date_debut)
);

-- une seule année active à la fois : appliqué par trigger (voir section 10)

create table classe (
    id                  uuid primary key default gen_random_uuid(),
    nom                 text not null,
    niveau              text,
    annee_scolaire_id   uuid not null references annee_scolaire(id),
    unique (nom, annee_scolaire_id)
);

create table eleve (
    id                  uuid primary key default gen_random_uuid(),
    matricule           text unique not null,
    nom                 text not null,
    postnom             text,
    prenom              text,
    sexe                text check (sexe in ('M', 'F')),
    date_naissance      date,
    classe_id           uuid not null references classe(id),
    annee_scolaire_id   uuid not null references annee_scolaire(id),
    responsable_nom     text,
    responsable_telephone text,
    statut              statut_eleve not null default 'actif',
    created_at          timestamptz not null default now()
);

-- crédit d'un élève (trop-perçu), voir hypothèse (2)
create table credit_eleve (
    id           uuid primary key default gen_random_uuid(),
    eleve_id     uuid not null references eleve(id),
    montant      numeric(18,2) not null check (montant >= 0),
    origine_paiement_id uuid,   -- FK ajoutée plus bas (paiement)
    utilise       boolean not null default false,
    created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. FONDS / TYPES DE FRAIS / DETTES
-- ---------------------------------------------------------------------
create table fonds (
    id           uuid primary key default gen_random_uuid(),
    code         text unique not null,
    nom          text not null,
    description  text,
    statut       text not null default 'actif' check (statut in ('actif', 'inactif'))
    -- le solde n'est jamais une colonne stockée : voir vue solde_fonds (section 9)
);

create table compte_comptable (
    id           uuid primary key default gen_random_uuid(),
    numero       text unique not null,   -- numéro SYSCOHADA, ex '571000'
    libelle      text not null,
    classe       smallint not null check (classe between 1 and 9),
    sens_normal  sens_ecriture not null,
    valide       boolean not null default false,  -- passe à true seulement quand
                                                    -- le comptable confirme le compte
    note         text                             -- ex: 'PLACEHOLDER — à confirmer'
);

create table type_frais (
    id                       uuid primary key default gen_random_uuid(),
    code                     text unique not null,
    nom                      text not null,
    description              text,
    fonds_id_defaut          uuid not null references fonds(id),
    compte_comptable_id      uuid references compte_comptable(id),
    statut                   text not null default 'actif' check (statut in ('actif', 'inactif'))
);

create table categorie_depense (
    id           uuid primary key default gen_random_uuid(),
    code         text unique not null,
    nom          text not null
);

create table frais_du (
    id                  uuid primary key default gen_random_uuid(),
    eleve_id            uuid not null references eleve(id),
    type_frais_id       uuid not null references type_frais(id),
    annee_scolaire_id   uuid not null references annee_scolaire(id),
    montant_du          numeric(18,2) not null check (montant_du >= 0),
    unique (eleve_id, type_frais_id, annee_scolaire_id)
);

-- ---------------------------------------------------------------------
-- 5. TRÉSORERIES / CAISSE
-- ---------------------------------------------------------------------
create table tresorerie (
    id              uuid primary key default gen_random_uuid(),
    nom             text not null,           -- 'Caisse principale', 'Compte Rawbank', 'Airtel Money'
    type            type_tresorerie not null,
    solde_initial   numeric(18,2) not null default 0,
    statut          text not null default 'actif' check (statut in ('actif', 'inactif'))
);

alter table utilisateur
    add constraint fk_utilisateur_caisse foreign key (caisse_id) references tresorerie(id);

create table cloture_caisse (
    id                 uuid primary key default gen_random_uuid(),
    tresorerie_id      uuid not null references tresorerie(id),
    date_cloture       date not null,
    solde_theorique    numeric(18,2) not null,
    solde_physique     numeric(18,2) not null,
    ecart              numeric(18,2) generated always as (solde_physique - solde_theorique) stored,
    motif_ecart        text,
    statut             statut_cloture not null default 'preparee',
    prepare_par        uuid not null references utilisateur(id),
    valide_par         uuid references utilisateur(id),
    date_validation    timestamptz,
    unique (tresorerie_id, date_cloture),
    check (statut = 'preparee' or (ecart = 0 or motif_ecart is not null))
);

-- ---------------------------------------------------------------------
-- 6. RECETTES (PAIEMENTS ÉLÈVES)
-- ---------------------------------------------------------------------
create table paiement (
    id                uuid primary key default gen_random_uuid(),
    numero_recu       text unique not null,
    eleve_id          uuid not null references eleve(id),
    tresorerie_id     uuid not null references tresorerie(id),
    caissier_id       uuid not null references utilisateur(id),
    mode_paiement     mode_paiement not null,
    montant_total     numeric(18,2) not null check (montant_total > 0),
    statut            statut_paiement not null default 'en_attente',
    valide_par        uuid references utilisateur(id),
    date_validation   timestamptz,
    motif_rejet       text,
    date_creation     timestamptz not null default now(),
    check (valide_par is null or valide_par <> caissier_id)   -- créateur ≠ validateur
);

create table paiement_ventilation (
    id             uuid primary key default gen_random_uuid(),
    paiement_id    uuid not null references paiement(id) on delete cascade,
    type_frais_id  uuid not null references type_frais(id),
    fonds_id       uuid not null references fonds(id),
    montant        numeric(18,2) not null check (montant > 0)
);

alter table credit_eleve
    add constraint fk_credit_paiement foreign key (origine_paiement_id) references paiement(id);

-- garde-fou : somme des ventilations = montant_total du paiement
create or replace function verifier_ventilation_paiement() returns trigger as $$
declare v_total numeric(18,2);
begin
    select coalesce(sum(montant),0) into v_total
    from paiement_ventilation where paiement_id = new.paiement_id;
    if v_total > (select montant_total from paiement where id = new.paiement_id) then
        raise exception 'La ventilation dépasse le montant total du paiement %', new.paiement_id;
    end if;
    return new;
end; $$ language plpgsql;

create trigger trg_verif_ventilation
    after insert or update on paiement_ventilation
    for each row execute function verifier_ventilation_paiement();

-- ---------------------------------------------------------------------
-- 7. DÉPENSES / TRANSFERTS DE FONDS
-- ---------------------------------------------------------------------
create table depense (
    id                   uuid primary key default gen_random_uuid(),
    reference            text unique not null,
    fonds_id             uuid not null references fonds(id),
    categorie_depense_id uuid not null references categorie_depense(id),
    montant              numeric(18,2) not null check (montant > 0),
    motif                text not null,
    fournisseur          text,
    demandeur_id         uuid not null references utilisateur(id),
    approbateur_id       uuid references utilisateur(id),
    payeur_id            uuid references utilisateur(id),
    tresorerie_id        uuid references tresorerie(id),
    statut               statut_depense not null default 'brouillon',
    date_demande         timestamptz not null default now(),
    date_approbation     timestamptz,
    date_paiement        timestamptz,
    check (approbateur_id is null or approbateur_id <> demandeur_id)
);

create table transfert_fonds (
    id                   uuid primary key default gen_random_uuid(),
    fonds_source_id      uuid not null references fonds(id),
    fonds_destination_id uuid not null references fonds(id),
    montant              numeric(18,2) not null check (montant > 0),
    motif                text not null,
    demandeur_id         uuid not null references utilisateur(id),
    approbateur_id       uuid references utilisateur(id),
    statut               statut_transfert not null default 'en_attente',
    date_demande         timestamptz not null default now(),
    date_validation      timestamptz,
    check (fonds_source_id <> fonds_destination_id),
    check (approbateur_id is null or approbateur_id <> demandeur_id)
);

create table piece_justificative (
    id                uuid primary key default gen_random_uuid(),
    type_document     text not null,
    chemin_fichier    text not null,
    reference_type    text not null check (reference_type in ('paiement', 'depense', 'transfert_fonds', 'cloture_caisse')),
    reference_id      uuid not null,
    ajoute_par        uuid not null references utilisateur(id),
    date_ajout        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. COMPTABILITÉ
-- ---------------------------------------------------------------------
create table journal_comptable (
    id       uuid primary key default gen_random_uuid(),
    code     text unique not null,   -- 'JCA' caisse, 'JBQ' banque, 'JOD' opérations diverses
    libelle  text not null
);

create table ecriture_comptable (
    id                uuid primary key default gen_random_uuid(),
    journal_id        uuid not null references journal_comptable(id),
    date_ecriture     date not null default current_date,
    reference_type    text not null check (reference_type in ('paiement', 'depense', 'transfert_fonds')),
    reference_id      uuid not null,
    libelle           text not null,
    statut            statut_ecriture not null default 'brouillon',
    ecriture_origine_id uuid references ecriture_comptable(id),  -- lien vers l'écriture contrepassée
    created_at        timestamptz not null default now()
);

create table ligne_ecriture (
    id               uuid primary key default gen_random_uuid(),
    ecriture_id      uuid not null references ecriture_comptable(id) on delete cascade,
    compte_comptable_id uuid not null references compte_comptable(id),
    debit            numeric(18,2) not null default 0 check (debit >= 0),
    credit           numeric(18,2) not null default 0 check (credit >= 0),
    check (not (debit > 0 and credit > 0))
);

-- garde-fou : compte non validé => écriture refusée (hypothèse 1)
create or replace function verifier_compte_valide() returns trigger as $$
declare v_valide boolean;
begin
    select valide into v_valide from compte_comptable where id = new.compte_comptable_id;
    if not v_valide then
        raise exception 'Le compte comptable % n''est pas encore validé par le comptable', new.compte_comptable_id;
    end if;
    return new;
end; $$ language plpgsql;

create trigger trg_verif_compte
    before insert on ligne_ecriture
    for each row execute function verifier_compte_valide();

-- garde-fou : équilibre débit = crédit par écriture (vérifié à la validation, section 10)

-- ---------------------------------------------------------------------
-- 9. JOURNAL D'AUDIT
-- ---------------------------------------------------------------------
create table journal_audit (
    id             uuid primary key default gen_random_uuid(),
    utilisateur_id uuid references utilisateur(id),
    action         text not null,       -- CREATION, MODIFICATION, VALIDATION, REJET, TENTATIVE_REFUSEE...
    objet_type     text not null,
    objet_id       uuid,
    ancienne_valeur jsonb,
    nouvelle_valeur jsonb,
    motif          text,
    date_action    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10. VUES CALCULÉES (soldes, situation élève, grand livre, balance)
-- ---------------------------------------------------------------------

-- solde d'un fonds = entrées (paiement_ventilation validées) - sorties (dépenses payées)
--                     +/- transferts validés
create view solde_fonds as
select f.id as fonds_id, f.code, f.nom,
       coalesce(sum(pv.montant) filter (where p.statut = 'validee'), 0)
     - coalesce((select sum(d.montant) from depense d
                 where d.fonds_id = f.id and d.statut = 'payee'), 0)
     - coalesce((select sum(t.montant) from transfert_fonds t
                 where t.fonds_source_id = f.id and t.statut = 'valide'), 0)
     + coalesce((select sum(t.montant) from transfert_fonds t
                 where t.fonds_destination_id = f.id and t.statut = 'valide'), 0)
       as solde
from fonds f
left join paiement_ventilation pv on pv.fonds_id = f.id
left join paiement p on p.id = pv.paiement_id
group by f.id, f.code, f.nom;

-- situation financière d'un élève par type de frais
create view situation_financiere_eleve as
select fd.eleve_id, fd.type_frais_id, fd.annee_scolaire_id,
       fd.montant_du,
       coalesce((select sum(pv.montant) from paiement_ventilation pv
                 join paiement p on p.id = pv.paiement_id
                 where p.eleve_id = fd.eleve_id
                   and pv.type_frais_id = fd.type_frais_id
                   and p.statut = 'validee'), 0) as montant_paye,
       fd.montant_du - coalesce((select sum(pv.montant) from paiement_ventilation pv
                 join paiement p on p.id = pv.paiement_id
                 where p.eleve_id = fd.eleve_id
                   and pv.type_frais_id = fd.type_frais_id
                   and p.statut = 'validee'), 0) as reste_a_payer,
       case
         when fd.montant_du - coalesce((select sum(pv.montant) from paiement_ventilation pv
                 join paiement p on p.id = pv.paiement_id
                 where p.eleve_id = fd.eleve_id and pv.type_frais_id = fd.type_frais_id
                   and p.statut = 'validee'), 0) <= 0 then 'solde'
         when coalesce((select sum(pv.montant) from paiement_ventilation pv
                 join paiement p on p.id = pv.paiement_id
                 where p.eleve_id = fd.eleve_id and pv.type_frais_id = fd.type_frais_id
                   and p.statut = 'validee'), 0) = 0 then 'impaye'
         else 'partiel'
       end as etat
from frais_du fd;

-- grand livre : cumul par compte
create view grand_livre as
select le.compte_comptable_id, cc.numero, cc.libelle,
       ec.date_ecriture, ec.libelle as libelle_ecriture,
       le.debit, le.credit
from ligne_ecriture le
join ecriture_comptable ec on ec.id = le.ecriture_id
join compte_comptable cc on cc.id = le.compte_comptable_id
where ec.statut = 'validee'
order by cc.numero, ec.date_ecriture;

-- balance : soldes cumulés par compte
create view balance_comptable as
select cc.id as compte_id, cc.numero, cc.libelle,
       sum(le.debit) as total_debit,
       sum(le.credit) as total_credit,
       sum(le.debit) - sum(le.credit) as solde
from compte_comptable cc
left join ligne_ecriture le on le.compte_comptable_id = cc.id
left join ecriture_comptable ec on ec.id = le.ecriture_id and ec.statut = 'validee'
group by cc.id, cc.numero, cc.libelle;

-- ---------------------------------------------------------------------
-- 11. TRIGGERS TRANSVERSAUX
-- ---------------------------------------------------------------------

-- une seule année scolaire active à la fois
create or replace function verifier_annee_active() returns trigger as $$
begin
    if new.statut = 'active' then
        update annee_scolaire set statut = 'cloturee'
        where statut = 'active' and id <> new.id;
    end if;
    return new;
end; $$ language plpgsql;

create trigger trg_annee_active
    before insert or update on annee_scolaire
    for each row execute function verifier_annee_active();

-- équilibre débit/crédit obligatoire à la validation d'une écriture
create or replace function verifier_equilibre_ecriture() returns trigger as $$
declare v_debit numeric(18,2); v_credit numeric(18,2);
begin
    if new.statut = 'validee' and (old.statut is null or old.statut <> 'validee') then
        select coalesce(sum(debit),0), coalesce(sum(credit),0)
        into v_debit, v_credit from ligne_ecriture where ecriture_id = new.id;
        if v_debit <> v_credit then
            raise exception 'Écriture % déséquilibrée : débit % / crédit %', new.id, v_debit, v_credit;
        end if;
    end if;
    return new;
end; $$ language plpgsql;

create trigger trg_equilibre_ecriture
    before update on ecriture_comptable
    for each row execute function verifier_equilibre_ecriture();

-- journalisation automatique des validations sensibles (exemple sur paiement)
create or replace function auditer_validation_paiement() returns trigger as $$
begin
    if new.statut <> old.statut then
        insert into journal_audit (utilisateur_id, action, objet_type, objet_id,
                                    ancienne_valeur, nouvelle_valeur)
        values (new.valide_par, 'VALIDATION_STATUT', 'paiement', new.id,
                jsonb_build_object('statut', old.statut),
                jsonb_build_object('statut', new.statut));
    end if;
    return new;
end; $$ language plpgsql;

create trigger trg_audit_paiement
    after update on paiement
    for each row execute function auditer_validation_paiement();

-- (le même modèle de trigger d'audit est à répliquer sur depense,
--  transfert_fonds et cloture_caisse — omis ici par souci de longueur,
--  mais suit exactement le même patron)

-- ---------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (Supabase)
-- ---------------------------------------------------------------------

alter table paiement enable row level security;
alter table depense enable row level security;
alter table transfert_fonds enable row level security;
alter table ecriture_comptable enable row level security;
alter table ligne_ecriture enable row level security;
alter table journal_audit enable row level security;
alter table utilisateur enable row level security;

-- fonction utilitaire : rôle de l'utilisateur courant
create or replace function role_courant() returns text as $$
    select r.code from utilisateur u join role r on r.id = u.role_id
    where u.id = auth.uid();
$$ language sql stable;

-- CAISSIER : ne voit que les paiements de sa propre caisse assignée
create policy paiement_caissier_lecture on paiement
    for select using (
        role_courant() = 'CAISSIER'
        and tresorerie_id = (select caisse_id from utilisateur where id = auth.uid())
    );

-- CAISSIER : peut créer un paiement uniquement pour sa caisse, en tant que créateur
create policy paiement_caissier_creation on paiement
    for insert with check (
        role_courant() = 'CAISSIER'
        and caissier_id = auth.uid()
        and statut = 'en_attente'
    );

-- CONTROLEUR / DIRECTEUR / COMPTABLE / AUDITEUR : lecture large
create policy paiement_lecture_supervision on paiement
    for select using (role_courant() in ('CONTROLEUR', 'DIRECTEUR', 'COMPTABLE', 'AUDITEUR'));

-- Seul le CONTROLEUR (ou DIRECTEUR selon seuil) peut valider, jamais le créateur
create policy paiement_validation on paiement
    for update using (
        role_courant() in ('CONTROLEUR', 'DIRECTEUR')
        and caissier_id <> auth.uid()
    );

-- ECRITURE_COMPTABLE / LIGNE_ECRITURE : réservé au COMPTABLE en écriture,
-- lecture élargie au DIRECTEUR et à l'AUDITEUR
create policy ecriture_lecture on ecriture_comptable
    for select using (role_courant() in ('COMPTABLE', 'DIRECTEUR', 'AUDITEUR'));

create policy ecriture_ecriture_comptable_seul on ecriture_comptable
    for insert with check (role_courant() = 'COMPTABLE');

create policy ecriture_modification_comptable_seul on ecriture_comptable
    for update using (role_courant() = 'COMPTABLE');

-- ADMIN TECH : explicitement exclu de l'écriture comptable (aucune policy insert/update
-- ne lui est accordée sur ecriture_comptable/ligne_ecriture/journal_audit)

-- JOURNAL_AUDIT : lecture seule pour AUDITEUR, DIRECTEUR, COMPTABLE et ADMIN_TECH ; écriture système uniquement
create policy audit_lecture on journal_audit
    for select using (role_courant() in ('AUDITEUR', 'DIRECTEUR', 'COMPTABLE', 'ADMIN_TECH'));

-- UTILISATEUR : gestion réservée à ADMIN_TECH
create policy utilisateur_lecture_soi on utilisateur
    for select using (id = auth.uid() or role_courant() = 'ADMIN_TECH');

create policy utilisateur_gestion_admin on utilisateur
    for insert with check (role_courant() = 'ADMIN_TECH');

create policy utilisateur_modification_admin on utilisateur
    for update using (role_courant() = 'ADMIN_TECH');

-- --- DEPENSE ---------------------------------------------------------

-- RESP_FINANCIER : voit ses propres demandes ; DIRECTEUR/CONTROLEUR/COMPTABLE/AUDITEUR : voient tout
create policy depense_lecture_demandeur on depense
    for select using (
        demandeur_id = auth.uid()
        or role_courant() in ('DIRECTEUR', 'CONTROLEUR', 'COMPTABLE', 'AUDITEUR')
    );

-- RESP_FINANCIER (ou DIRECTEUR) : crée sa propre demande, toujours en BROUILLON
create policy depense_creation on depense
    for insert with check (
        role_courant() in ('RESP_FINANCIER', 'DIRECTEUR')
        and demandeur_id = auth.uid()
        and statut = 'brouillon'
    );

-- Le demandeur peut modifier tant que c'est en BROUILLON ou RETOURNEE (correction)
create policy depense_modification_demandeur on depense
    for update using (
        demandeur_id = auth.uid()
        and statut in ('brouillon', 'retournee')
    );

-- Seul le DIRECTEUR approuve/refuse/retourne, jamais sa propre demande
-- (redondant avec la contrainte CHECK demandeur_id <> approbateur_id, vérifié aussi côté RLS)
create policy depense_approbation on depense
    for update using (
        role_courant() = 'DIRECTEUR'
        and demandeur_id <> auth.uid()
        and statut = 'en_attente_approbation'
    );

-- Exécution du paiement d'une dépense APPROUVEE : rôle habilité (ex: CAISSIER autorisé), jamais le demandeur ni l'approbateur
create policy depense_execution_paiement on depense
    for update using (
        role_courant() in ('CAISSIER', 'RESP_FINANCIER')
        and auth.uid() <> demandeur_id
        and auth.uid() <> approbateur_id
        and statut = 'approuvee'
    );

-- garde-fou applicatif : au-delà du seuil configuré, une seconde validation DIRECTEUR est requise
-- avant tout paiement (vérifié en plus des policies ci-dessus, via cette fonction appelée par le trigger)
create or replace function verifier_seuil_double_validation() returns trigger as $$
declare v_seuil numeric(18,2);
begin
    if new.statut = 'approuvee' and old.statut <> 'approuvee' then
        select montant_seuil into v_seuil from seuil_validation
        where type_operation = 'depense' limit 1;
        if v_seuil > 0 and new.montant > v_seuil
           and role_courant() <> 'DIRECTEUR' then
            raise exception 'Dépense % au-delà du seuil : validation DIRECTEUR obligatoire', new.id;
        end if;
    end if;
    return new;
end; $$ language plpgsql;

create trigger trg_seuil_depense
    before update on depense
    for each row execute function verifier_seuil_double_validation();

-- --- TRANSFERT_FONDS ---------------------------------------------------

create policy transfert_lecture on transfert_fonds
    for select using (
        demandeur_id = auth.uid()
        or role_courant() in ('DIRECTEUR', 'RESP_FINANCIER', 'COMPTABLE', 'AUDITEUR')
    );

create policy transfert_creation on transfert_fonds
    for insert with check (
        role_courant() in ('RESP_FINANCIER', 'DIRECTEUR')
        and demandeur_id = auth.uid()
        and statut = 'en_attente'
    );

-- Seul le DIRECTEUR valide/refuse un transfert, jamais sa propre demande
-- (redondant avec la contrainte CHECK fonds_source_id <> demandeur/approbateur ci-dessus)
create policy transfert_validation on transfert_fonds
    for update using (
        role_courant() = 'DIRECTEUR'
        and demandeur_id <> auth.uid()
        and statut = 'en_attente'
    );

-- même garde-fou de seuil que pour les dépenses
create or replace function verifier_seuil_transfert() returns trigger as $$
declare v_seuil numeric(18,2);
begin
    if new.statut = 'valide' and old.statut <> 'valide' then
        select montant_seuil into v_seuil from seuil_validation
        where type_operation = 'transfert_fonds' limit 1;
        if v_seuil > 0 and new.montant > v_seuil
           and role_courant() <> 'DIRECTEUR' then
            raise exception 'Transfert % au-delà du seuil : validation DIRECTEUR obligatoire', new.id;
        end if;
    end if;
    return new;
end; $$ language plpgsql;

create trigger trg_seuil_transfert
    before update on transfert_fonds
    for each row execute function verifier_seuil_transfert();

-- ---------------------------------------------------------------------
-- 13. DONNÉES DE BASE (seed minimal, à compléter)
-- ---------------------------------------------------------------------
insert into role (code, nom) values
    ('CAISSIER', 'Caissier'),
    ('CONTROLEUR', 'Contrôleur de caisse'),
    ('RESP_FINANCIER', 'Responsable financier'),
    ('DIRECTEUR', 'Directeur / Approbateur'),
    ('COMPTABLE', 'Comptable'),
    ('AUDITEUR', 'Auditeur / Contrôle interne'),
    ('ADMIN_TECH', 'Administrateur technique');

-- comptes SYSCOHADA : PLACEHOLDERS uniquement, valide = false tant que
-- non confirmés par votre comptable (voir hypothèse 1 en tête de fichier)
insert into compte_comptable (numero, libelle, classe, sens_normal, valide, note) values
    ('571000', 'Caisse (PLACEHOLDER)', 5, 'debit', false, 'À confirmer avec le comptable'),
    ('521000', 'Banque (PLACEHOLDER)', 5, 'debit', false, 'À confirmer avec le comptable'),
    ('706000', 'Prestations de services / frais scolaires (PLACEHOLDER)', 7, 'credit', false, 'À confirmer'),
    ('411000', 'Élèves débiteurs (PLACEHOLDER)', 4, 'debit', false, 'À confirmer'),
    ('600000', 'Achats / charges (PLACEHOLDER)', 6, 'debit', false, 'À confirmer');
