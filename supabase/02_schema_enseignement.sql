-- =====================================================================
-- COMPLÉMENT AU SCHÉMA — Module Enseignement
-- À exécuter APRÈS schema-logiciel-financier-scolaire-rdc.sql (même base).
-- Aucune table du module finance n'est modifiée ici — uniquement des ajouts,
-- reliés à `eleve` et `classe` déjà existants.
-- =====================================================================

create type statut_journee   as enum ('ouverte', 'cloturee');
create type statut_evaluation as enum ('brouillon', 'validee');

-- ---------------------------------------------------------------------
-- MATIÈRES, PONDÉRATIONS, AFFECTATIONS
-- ---------------------------------------------------------------------
create table matiere (
    id                  uuid primary key default gen_random_uuid(),
    code                text unique not null,
    nom                 text not null,
    annee_scolaire_id   uuid not null references annee_scolaire(id)
);

-- Pondération par période — créée en Période 1, verrouillée après validation
-- du DIRECTEUR (voir colonne `verrouille`).
create table pondération_matiere (
    id                  uuid primary key default gen_random_uuid(),
    matiere_id          uuid not null references matiere(id),
    annee_scolaire_id   uuid not null references annee_scolaire(id),
    ponderation         numeric(5,2) not null check (ponderation > 0),
    verrouille          boolean not null default false,
    valide_par           uuid references utilisateur(id),
    unique (matiere_id, annee_scolaire_id)
);

create table classe_enseignant_principal (
    classe_id       uuid primary key references classe(id),
    enseignant_id   uuid not null references utilisateur(id)
);

create table classe_matiere_enseignant (
    id             uuid primary key default gen_random_uuid(),
    classe_id      uuid not null references classe(id),
    matiere_id     uuid not null references matiere(id),
    enseignant_id  uuid not null references utilisateur(id),
    unique (classe_id, matiere_id)
);

-- ---------------------------------------------------------------------
-- HORAIRE, JOURNÉES, PRÉSENCES, JOURNAL D'ENSEIGNEMENT
-- ---------------------------------------------------------------------
create table creneau_horaire (
    id          text primary key,   -- 'h1', 'r1', 'h2'...
    label       text not null,
    ordre       smallint not null,
    recreation  boolean not null default false
);

create table journee_scolaire (
    id           uuid primary key default gen_random_uuid(),
    classe_id    uuid not null references classe(id),
    date_jour    date not null,
    statut       statut_journee not null default 'ouverte',
    rapport      text,
    cloture_par  uuid references utilisateur(id),
    date_cloture timestamptz,
    unique (classe_id, date_jour)
);

create table presence (
    id           uuid primary key default gen_random_uuid(),
    journee_id   uuid not null references journee_scolaire(id) on delete cascade,
    eleve_id     uuid not null references eleve(id),
    present      boolean not null default true,
    unique (journee_id, eleve_id)
);

create table journal_enseignement (
    id            uuid primary key default gen_random_uuid(),
    journee_id    uuid not null references journee_scolaire(id) on delete cascade,
    creneau_id    text not null references creneau_horaire(id),
    matiere_id    uuid references matiere(id),
    lecon         text,
    unique (journee_id, creneau_id)
);

-- ---------------------------------------------------------------------
-- PÉRIODES, ÉVALUATIONS, NOTES, BULLETINS
-- ---------------------------------------------------------------------
create table periode_scolaire (
    id                  text primary key,  -- 'p1'..'p6','exam1'..'exam3'
    label               text not null,
    trimestre           smallint not null check (trimestre in (1,2,3)),
    est_examen          boolean not null default false,
    ordre               smallint not null
);

create table evaluation (
    id             uuid primary key default gen_random_uuid(),
    classe_id      uuid not null references classe(id),
    matiere_id     uuid not null references matiere(id),
    periode_id     text not null references periode_scolaire(id),
    nom            text not null,
    points_max     numeric(6,2) not null check (points_max > 0),
    statut         statut_evaluation not null default 'brouillon',
    cree_par       uuid not null references utilisateur(id),
    created_at     timestamptz not null default now()
);

create table note (
    id             uuid primary key default gen_random_uuid(),
    evaluation_id  uuid not null references evaluation(id) on delete cascade,
    eleve_id       uuid not null references eleve(id),
    points_obtenus numeric(6,2) check (points_obtenus >= 0),
    unique (evaluation_id, eleve_id)
);

-- Bulletin de période : snapshot figé à la clôture d'une période/examen
-- (équivalent de `periodHistory` côté prototype), pour ne jamais recalculer
-- un historique si les pondérations changent plus tard.
create table bulletin_periode (
    id             uuid primary key default gen_random_uuid(),
    eleve_id       uuid not null references eleve(id),
    classe_id      uuid not null references classe(id),
    periode_id     text not null references periode_scolaire(id),
    total          numeric(8,2) not null,
    total_max      numeric(8,2) not null,
    pourcentage    numeric(5,2) not null,
    place          integer,
    detail         jsonb not null,  -- détail par matière (obtenu/max/note/pond)
    unique (eleve_id, periode_id)
);

create table bulletin_trimestre (
    id             uuid primary key default gen_random_uuid(),
    eleve_id       uuid not null references eleve(id),
    classe_id      uuid not null references classe(id),
    trimestre      smallint not null check (trimestre in (1,2,3)),
    total          numeric(8,2) not null,
    total_max      numeric(8,2) not null,
    pourcentage    numeric(5,2) not null,
    place          integer,
    detail         jsonb not null,
    unique (eleve_id, trimestre)
);

-- ---------------------------------------------------------------------
-- ESPACE PUBLIC — COMMUNIQUÉS
-- ---------------------------------------------------------------------
create type statut_communique as enum ('brouillon', 'publie', 'archive');

create table communique (
    id           uuid primary key default gen_random_uuid(),
    titre        text not null,
    contenu      text not null,
    statut       statut_communique not null default 'brouillon',
    cree_par     uuid not null references utilisateur(id),
    publie_par   uuid references utilisateur(id),
    date_publication timestamptz
);

-- ---------------------------------------------------------------------
-- RLS — Enseignement (symétrique aux policies finance déjà livrées)
-- ---------------------------------------------------------------------
alter table evaluation enable row level security;
alter table note enable row level security;
alter table journee_scolaire enable row level security;
alter table presence enable row level security;
alter table journal_enseignement enable row level security;
alter table pondération_matiere enable row level security;
alter table communique enable row level security;

-- ENSEIGNANT : ne touche que ses propres classes/matières affectées
create policy evaluation_enseignant on evaluation
    for all using (
        role_courant() = 'ENSEIGNANT'
        and exists (
            select 1 from classe_matiere_enseignant cme
            where cme.classe_id = evaluation.classe_id
              and cme.matiere_id = evaluation.matiere_id
              and cme.enseignant_id = auth.uid()
        )
    );

create policy note_enseignant on note
    for all using (
        role_courant() = 'ENSEIGNANT'
        and exists (
            select 1 from evaluation e
            join classe_matiere_enseignant cme on cme.classe_id = e.classe_id and cme.matiere_id = e.matiere_id
            where e.id = note.evaluation_id and cme.enseignant_id = auth.uid()
        )
    );

-- SECRÉTAIRE : jamais d'accès à evaluation/note (aucune policy accordée = refus par défaut avec RLS activé)

-- Lecture large pour supervision
create policy evaluation_lecture_direction on evaluation
    for select using (role_courant() in ('DIRECTEUR', 'SECRETAIRE', 'AUDITEUR'));
create policy note_lecture_direction on note
    for select using (role_courant() in ('DIRECTEUR', 'AUDITEUR'));  -- SECRETAIRE volontairement exclu

-- Journées/présences : ENSEIGNANT sur ses classes, lecture large en supervision
create policy journee_enseignant on journee_scolaire
    for all using (
        role_courant() = 'ENSEIGNANT'
        and exists (
            select 1 from classe_enseignant_principal cep
            where cep.classe_id = journee_scolaire.classe_id and cep.enseignant_id = auth.uid()
        )
    );
create policy journee_lecture_direction on journee_scolaire
    for select using (role_courant() in ('DIRECTEUR', 'SECRETAIRE', 'AUDITEUR'));

-- Espace public : lecture des journées clôturées uniquement, sans jointure élève
create policy journee_lecture_publique on journee_scolaire
    for select using (statut = 'cloturee');
create policy journal_lecture_publique on journal_enseignement
    for select using (
        exists (select 1 from journee_scolaire j where j.id = journal_enseignement.journee_id and j.statut = 'cloturee')
    );

-- Communiqués : SECRÉTAIRE écrit, DIRECTEUR valide, public lit uniquement les publiés
create policy communique_secretaire on communique
    for all using (role_courant() = 'SECRETAIRE');
create policy communique_lecture_publique on communique
    for select using (statut = 'publie');

-- Pondérations : SECRÉTAIRE prépare, verrouillage empêche toute modification ultérieure
create policy ponderation_secretaire on pondération_matiere
    for all using (role_courant() = 'SECRETAIRE' and verrouille = false);
create policy ponderation_lecture on pondération_matiere
    for select using (true);

-- ---------------------------------------------------------------------
-- DEVOIRS ET AFFAIRES À APPORTER (espace public — vu par les parents)
-- ---------------------------------------------------------------------
create type type_devoir as enum ('devoir', 'a_apporter');

create table devoir (
    id           uuid primary key default gen_random_uuid(),
    journee_id   uuid not null references journee_scolaire(id) on delete cascade,
    matiere_id   uuid references matiere(id),
    type         type_devoir not null default 'devoir',
    contenu      text not null,
    date_limite  date,
    cree_par     uuid not null references utilisateur(id),
    created_at   timestamptz not null default now()
);

alter table devoir enable row level security;

-- ENSEIGNANT : ne crée/modifie des devoirs que sur ses propres classes
-- (via la journée, qui porte déjà classe_id), et seulement journée non clôturée.
create policy devoir_enseignant on devoir
    for all using (
        role_courant() = 'ENSEIGNANT'
        and exists (
            select 1 from journee_scolaire j
            join classe_enseignant_principal cep on cep.classe_id = j.classe_id
            where j.id = devoir.journee_id and cep.enseignant_id = auth.uid()
        )
    );

-- Lecture publique : uniquement si la journée associée est clôturée —
-- symétrique à `journal_lecture_publique`, aucune donnée élève exposée.
create policy devoir_lecture_publique on devoir
    for select using (
        exists (select 1 from journee_scolaire j where j.id = devoir.journee_id and j.statut = 'cloturee')
    );

-- Supervision interne (direction/secrétariat/audit)
create policy devoir_lecture_direction on devoir
    for select using (role_courant() in ('DIRECTEUR', 'SECRETAIRE', 'AUDITEUR'));
