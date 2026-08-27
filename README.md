# École Connectée — architecture finale

## 1. Deux espaces, une seule application

```
ÉCOLE
│
├── ESPACE PUBLIC (sans connexion)
│     Présentation · Communiqués publiés · Classes → leçons enseignées
│     (uniquement les journées CLÔTURÉES, jamais de données élève)
│     Bouton discret "Connexion personnel"
│
└── ESPACE PERSONNEL (connecté, aiguillé par rôle)
      DIRECTEUR · SECRÉTAIRE · ENSEIGNANT · CAISSIER · CONTRÔLEUR
      · RESP_FINANCIER · COMPTABLE
```

`App.jsx` est le point d'aiguillage : aujourd'hui il route uniquement
Directeur/Enseignant/Enseignement (ce qui existait dans le prototype) et un
point de branchement `finance`. Le module finance déjà conçu (schéma SQL +
maquettes) vient s'y insérer comme son propre dossier `features/finance/*`,
sans dupliquer ce travail ici.

## 2. Le point de jonction entre les deux systèmes : l'élève

Une seule fiche `eleve` (table `eleve` du schéma SQL déjà livré) est
utilisée par les deux modules :

```
eleve (id, matricule, nom, classe_id, ...)
 ├── frais_du / paiement ─────────► module FINANCE (inchangé)
 └── presence / note / bulletin ──► module ENSEIGNEMENT (ce dossier)
```

Dans ce prototype, `classe.eleves` est encore un tableau de noms en dur
(`INITIAL_CLASSES`). C'est le seul point à faire évoluer en priorité pour
brancher le vrai backend : remplacer ces noms par des `eleve_id` provenant
de la table `eleve`, filtrés par `classe_id` et `annee_scolaire_id`.

## 3. Nouvelles entités à ajouter au schéma existant (aucune ne remplace le module finance)

`matiere`, `pondération_matiere`, `classe_enseignant_principal`,
`classe_matiere_enseignant` (affectations), `creneau_horaire`,
`journal_enseignement` (date, classe, créneau, matière, leçon),
`journee_scolaire` (statut ouverte/clôturée), `presence`,
`periode_scolaire` (P1…P6, examens, trimestres, correspond à `PHASE_ORDER`),
`evaluation`, `note`, `bulletin`, `communique`.

## 4. Séparation des rôles (RLS)

Les policies RLS du module finance restent telles quelles. On ajoute des
policies symétriques pour l'enseignement :

- **ENSEIGNANT** : lecture/écriture uniquement sur les classes/matières qui
  lui sont affectées (`classe_matiere_enseignant`) — jamais une classe
  codée en dur (voir le commentaire dans `App.jsx`/`ClassesList.jsx`).
- **SECRÉTAIRE** : écrit `eleve`, `classe`, `matiere`, `pondération_matiere`
  (avant verrouillage), `communique` — n'a **aucun** droit d'écriture sur
  `note` ou `evaluation`.
- **DIRECTEUR** : lecture large + validation des pondérations, jamais de
  modification directe d'une `note` (une correction exceptionnelle passe
  par une procédure tracée, symétrique à la contrepassation comptable).
- **Espace public** : interroge une vue dédiée (`journal_enseignement`
  join `journee_scolaire` où statut = clôturée), sans jointure vers
  `eleve`, `note`, `presence` ou toute donnée financière.

## 5. Structure des fichiers

```
src/
├── constants/        scolaire.js (phases, trimestres, horaire) · mockData.js
├── utils/             dates.js · bulletins.js (calculs purs, testables)
├── components/        ui/ (Chip, SectionCard) · layout/ (TopBar)
├── features/
│   ├── auth/          RoleSelect.jsx (à remplacer par Supabase Auth)
│   ├── home/          DirecteurHome.jsx
│   └── enseignement/
│       ├── ClassesList.jsx
│       ├── ClasseWorkspace.jsx   (orchestrateur d'état)
│       ├── tabs/                 JourneeTab.jsx · NotesTab.jsx
│       └── modals/               7 modales (ajout, historique, classements, bulletins)
└── App.jsx            routage racine + point de branchement du module finance
```

Toute la logique de calcul des notes/bulletins/classements a été extraite
telle quelle (aucun changement de comportement) dans `utils/bulletins.js`
sous forme de fonctions pures — c'est la partie la plus sensible du
prototype, donc la plus importante à ne pas avoir réécrite par erreur.

## 6. Un tableau de bord par rôle

Chaque rôle a maintenant son propre écran d'accueil (`features/dashboards/`
+ `features/home/DirecteurHome.jsx`), routé depuis `App.jsx` via
`HOME_SCREEN_BY_ROLE` :

| Rôle | Écran d'accueil | Contenu |
|---|---|---|
| Directeur | `DirecteurHome` | Portail vers Enseignement / Finance / Stock |
| Secrétaire | `SecretaireHome` | Élèves, classes, communiqués, affectations |
| Enseignant | `EnseignantHome` | Liste de **ses** classes uniquement |
| Caissier | `CaissierHome` | Solde caisse, nouveau paiement, dernières opérations |
| Contrôleur | `ControleurHome` | Recettes à valider, clôtures en attente |
| Resp. financier | `RespFinancierHome` | Solde des fonds, mes demandes de dépense |
| Comptable | `ComptableHome` | Écritures en brouillon, comptes SYSCOHADA à confirmer, aperçu balance |
| Admin technique | `UserManagement` | Gestion des comptes et attribution des rôles |
| Magasinier | `MagasinierHome` | Stock actuel, alertes de seuil, entrées/sorties, création d'articles |

Tous sont branchés sur de vrais appels Supabase (voir section 10) ; plus aucun n'utilise de données mock.

## 7. Attribution d'un rôle à quelqu'un

Un rôle ne se choisit jamais soi-même. Le flux réel :

1. La personne se connecte une première fois via **Supabase Auth**
   (email/mot de passe ou lien magique) → une ligne est créée dans
   `auth.users`, et automatiquement une ligne `utilisateur` sans `role_id`.
2. Elle apparaît dans **`features/admin/UserManagement.jsx`** avec le
   badge "Sans rôle".
3. L'**Admin Technique** (et lui seul, cf. policies RLS `utilisateur_gestion_admin`)
   lui assigne un `role_id` dans cet écran (+ une `caisse_id` si c'est un
   Caissier).
4. À partir de ce moment, RLS et l'interface lisent ce rôle pour tout le
   reste de l'application.

`RoleSelect.jsx` (sélection libre au démarrage) est une commodité de démo
uniquement — en production il disparaît, remplacé par un vrai écran de
connexion Supabase Auth qui redirige directement vers l'accueil du rôle
déjà assigné.

## 9. Palette de couleurs

Réduite à 4 couleurs partout dans le code : **bleu ciel** (positif/info),
**rouge** (négatif/alerte), **jaune** (en attente), **blanc** (neutre) —
plus les gris (`slate`) pour le texte/les bordures, qui font partie du
fond neutre. `components/ui/Chip.jsx` centralise les 4 tons (`sky`, `red`,
`yellow`, `white`) ; toute nouvelle couleur doit passer par ces 4 tons,
pas par une teinte ad hoc.

## 10. Appels Supabase réels — ce qui est branché

`src/lib/api/` contient tous les appels réels (plus de données mock dans
les composants listés ci-dessous) :
- `classes.js` — classes, élèves, matières/pondérations
- `journees.js` — journée du jour, présences, journal d'enseignement, historique
- `evaluations.js` — évaluations, notes, bulletins de période/trimestre
- `finance.js` — paiements, caisse, clôtures, fonds, dépenses, transferts, comptabilité
- `utilisateurs.js` — comptes, rôles, attribution de rôle, invitation
- `communiques.js` — communiqués (espace public + secrétariat)

Composants déjà branchés : `ClassesList`, `ClasseWorkspace` (élèves,
présences, évaluations/notes, snapshots de bulletins), `CaissierHome`,
`ControleurHome`, `RespFinancierHome`, `ComptableHome`, `UserManagement`.

`src/lib/useCurrentUser.js` lit la vraie session Supabase Auth + le rôle
réel assigné. `App.jsx` l'utilise en priorité ; `RoleSelect` ne reste que
comme filet de secours pour explorer l'interface sans session (dev local)
ou s'affiche un message d'attente si un compte existe sans rôle assigné.

**Encore mock/à finir** :
- `inviterUtilisateur()` appelle une Edge Function `invite-user` qui reste
  à écrire côté Supabase (nécessite la clé "service role", jamais dans le frontend).
- Écran de gestion des communiqués et des devoirs côté Secrétariat/Enseignant
  (la création existe déjà côté API — `createDevoir`, `createCommunique` —
  mais pas encore de formulaire dans l'interface).
- `mouvement_caisse` n'est alimenté par aucun trigger pour l'instant —
  `fetchSoldeTheorique()` calcule directement depuis `paiement`/`depense`,
  ce qui est correct mais moins traçable que la table dédiée prévue au schéma.

Navigation multi-jours de `JourneeTab` : **faite** (`dayOffset` réel,
navigation bloquée au-delà d'aujourd'hui, historique cliquable qui saute à
la vraie date).

Formulaires "Nouveau paiement", "Nouvelle dépense", "Transfert de fonds" et
"Clôture de caisse" (`features/finance/modals/`) sont branchés sur Supabase :
recherche d'élève en direct, ventilation par type de frais avec reste dû
préaffiché, calcul du solde théorique de caisse, et écriture réelle des
lignes `paiement`/`paiement_ventilation`/`depense`/`transfert_fonds`/`cloture_caisse`.

Espace public (`features/public/`) : **fait**, et devenu le point d'entrée
par défaut de `App.jsx` (avant toute connexion). `PublicHome` liste les
communiqués publiés et les classes ; `PublicClassePage` regroupe les leçons
par matière et affiche les devoirs/affaires à apporter (table `devoir`,
ajoutée à `supabase/02_schema_enseignement.sql` avec ses policies RLS —
lecture publique uniquement si la journée associée est clôturée, écriture
réservée à l'enseignant de la classe). "Connexion personnel" bascule vers
l'espace personnel (`RoleSelect` en démo, session réelle en production).

## 12. Module Stock & Patrimoine (nouveau rôle : Magasinier)

Gère le matériel de l'école (fournitures, produits d'entretien, mobilier)
sur le même principe que la caisse : rien n'est stocké en dur, tout est
recalculé depuis l'historique des mouvements.

- **Schéma** : `supabase/03_schema_stock.sql` — tables `categorie_article`,
  `article`, `mouvement_stock` (entrée/sortie), vue `solde_stock` (quantité
  disponible calculée), trigger `verifier_stock_suffisant` qui bloque toute
  sortie si le stock est insuffisant. Rôle `MAGASINIER` ajouté au seed.
- **Lien avec la finance** : une entrée de stock peut être rattachée à une
  `depense` déjà approuvée (`depense_id`), pour ne jamais dissocier l'argent
  sorti du matériel entré — sans pour autant dupliquer la logique comptable.
- **RLS** : le Magasinier gère les articles et mouvements ; Direction,
  Auditeur et Resp. financier ont un accès en lecture seule (supervision du
  patrimoine) ; personne d'autre n'y touche.
- **API** : `lib/api/stock.js` — `fetchSoldeStock`, `fetchArticles`,
  `createArticle`, `enregistrerEntree`, `enregistrerSortie`,
  `fetchDernieresMouvements`, `fetchDepensesApprouveesLiables`.
- **Écrans** : `MagasinierHome` (stock actuel, alertes de seuil, derniers
  mouvements) + 3 modales (`NouvelArticleModal`, `EntreeStockModal`,
  `SortieStockModal`, dans `features/stock/modals/`). Accessible aussi
  depuis le portail Directeur.

## 12.5 ⚠️ Correction de sécurité — connexion réelle obligatoire

`RoleSelect.jsx` (sélecteur de rôle sans mot de passe) était accessible en
production tant que personne n'avait de session — n'importe qui pouvait
donc s'auto-attribuer le rôle Admin Technique en ouvrant le site. C'est
corrigé : **`LoginForm.jsx`** (email + mot de passe réel via
`supabase.auth.signInWithPassword`) est maintenant le seul chemin possible
en production. `RoleSelect` n'est plus atteignable que derrière
`import.meta.env.DEV` (donc éliminé du bundle de production par Vite) et
un lien discret "Mode démo" tout en bas de `LoginForm`, lui-même invisible
si `devMode` est faux.

**Si le site était déjà en ligne avant ce correctif, redéployer immédiatement**
après avoir tiré ce zip — sans quoi l'ancienne faille reste active tant que
l'ancien build n'est pas remplacé.

## 13. Prochaines étapes suggérées

1. Brancher `classe.eleves` sur la vraie table `eleve` (retirer les noms en dur).
2. Ajouter `features/public/` (site public + communiqués) et `features/secretariat/`.
3. Ajouter les tables listées en section 3 au schéma SQL déjà livré.
4. Écrire les policies RLS enseignement (section 4) à côté de celles du module finance.
