# Base métier Frankenstein-Labs

La base métier Frankenstein-Labs est volontairement séparée du PostgreSQL interne de Coder. Coder reste la source de vérité pour les utilisateurs Coder, templates, workspaces, builds, provisioner jobs et logs. La base métier ne conserve que les projets, membres, liens vers des identifiants Coder, opérations et activités d’audit.

## Préparation actuelle

- `services/api/domain/models.mjs` définit les états et validations sans connexion réseau.
- `services/api/domain/migrations/001_initial.up.sql` prépare les tables métier.
- `services/api/domain/migrations/001_initial.down.sql` prépare le rollback.
- `FRANKENSTEIN_DATABASE_URL` est documenté comme DSN séparé.

Aucune migration n’a été exécutée et aucune base n’a été créée. Le fichier `CODER_PG_CONNECTION_URL` ne doit jamais être utilisé pour ces migrations.

## Modèle

`projects` porte le propriétaire et les métadonnées produit. `project_members` porte les rôles `owner`, `admin`, `member` et `viewer`. `workspace_links` référence un workspace Coder sans recopier son état. `operations` garde la corrélation métier avec un build ou un provisioner job Coder. `activities` garde l’historique d’audit produit.

Les identifiants et statuts Coder restent des références externes. Les secrets, tokens, état Terraform, paramètres sensibles et logs bruts ne sont pas stockés dans cette base.

## Suite autorisée mais non exécutée

Avant de connecter un repository à ce DSN, il faudra choisir le fournisseur PostgreSQL persistant, créer un rôle DB distinct, appliquer la migration sur cette base uniquement et ajouter un repository transactionnel idempotent. Ces étapes nécessitent une décision d’infrastructure et ne sont pas incluses dans le développement local actuel.
