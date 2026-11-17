# Déploiement Render

`render.yaml` prépare quatre composants :

- `frankenstein-coder` : service privé exécutant le serveur officiel Coder ;
- `frankenstein-coder-db` : base PostgreSQL Render utilisée par Coder (état durable) ;
- `frankenstein-api` : API publique (catalogue + proxy authentifié vers Coder) ;
- `frankenstein-catalog-worker` : synchronisation périodique du catalogue.

La configuration est non destructive : les templates et modules sont synchronisés
depuis les sources officielles, mais aucun workspace ni fournisseur cloud n'est
provisionné par le worker.

## Ce qui est réellement vérifié dans ce dépôt

| Contrôle | Statut | Preuve |
| --- | --- | --- |
| Image Coder officielle (digest épinglé) | RÉUSSI | `docker run … /healthz` → `OK` ; `terraform version` → `v1.17.2` |
| Construction de l'image API | RÉUSSI | `docker build -f services/api/Dockerfile` |
| API `/healthz`, `/api/catalog`, auth, 404/405 | RÉUSSI | `node --test "tests/*.test.mjs"` |
| Idempotence du catalogue | RÉUSSI | deux `import-catalog.sh` → `catalog/index.json` identique |
| Worker : clone, sync, import, index | RÉUSSI | `WORKER_RUN_ONCE=1` dans le conteneur |
| Déploiement Render réel | NON TESTÉ | nécessite un compte Render et des secrets |
| Provisionnement d'un workspace | NON TESTÉ | nécessite un backend de calcul externe réel |

## Prérequis (secrets Render)

Renseignez `CODER_ACCESS_URL`, `CODER_SESSION_TOKEN`, `FRANKENSTEIN_API_SECRET` et,
si nécessaire, les variables de stockage et `CORTEX_API_URL`.
`CODER_PG_CONNECTION_URL` est injectée automatiquement depuis la base
`frankenstein-coder-db`. `CODER_INTERNAL_URL` est injectée depuis le hostname
privé Render (`hostport`) et sert aux appels API internes ; `CODER_ACCESS_URL`
reste l'URL HTTPS publique que Coder communique aux utilisateurs et aux agents.
Ne commitez jamais ces valeurs.

`FRANKENSTEIN_API_SECRET` est généré par Render (`generateValue: true`). Toute
requête vers `/api/*` doit fournir l'en-tête `x-frankenstein-api-secret`. L'API
refuse de démarrer si le secret est absent (sauf `ALLOW_INSECURE_NO_AUTH=1`,
réservé au développement local).

## Compute des workspaces (important)

Un service privé Render ne fournit pas de socket Docker privilégié. Coder ne peut
donc pas lancer des workspaces Docker directement sur Render. Pointez Coder vers
un backend de calcul externe :

- Kubernetes via le provisioner `coder/coder-k8s` (recommandé) ;
- ou un hôte Docker externe accessible depuis le control plane.

Ne marquez pas le provisionnement comme opérationnel sans test réel.

## Déploiement

1. Créez le blueprint Render à partir de `render.yaml`.
2. Vérifiez la base PostgreSQL et la connectivité privée entre les services.
3. Configurez `CODER_ACCESS_URL` avec l'URL HTTPS publique du control plane.
4. Configurez les politiques Coder (utilisateurs, équipes, templates, quotas,
   autostop, permissions).
5. Démarrez l'API et vérifiez `/healthz`.
6. Exécutez `scripts/render-deploy-check.sh` depuis un environnement autorisé.
7. Testez d'abord un template minimal sur une infrastructure de test dédiée.

## Persistance

PostgreSQL conserve l'état du control plane. Les fichiers de workspaces ne
doivent jamais être écrits dans le disque éphémère de l'API ou du worker.
Configurez les volumes persistants au niveau du template Coder et de
l'infrastructure de workspace. L'arrêt d'un workspace ne doit pas supprimer son
volume ; la suppression explicite doit être une opération distincte.

Avant une migration ou un changement de service, utilisez
`scripts/backup-coder-db.sh` (via `pg_dump` et `CODER_PG_CONNECTION_URL`). Les
migrations de schéma restent celles du serveur officiel Coder ;
`scripts/render-migrate.sh` vérifie la présence du DSN et laisse le démarrage
officiel de Coder appliquer ses migrations.

Pour publier les templates matérialisés, utilisez
`scripts/publish-templates.sh`. Le script est en simulation par défaut ; il ne
pousse réellement que lorsque `PUBLISH=1`, avec `CODER_URL`, un CLI Coder
authentifié et `CODER_ORGANIZATION` explicitement fourni.

## Santé et limites

`/healthz` vérifie uniquement que l'API Frankenstein-Labs répond et indique si
les variables Coder sont configurées. `scripts/render-healthcheck.sh` ne prouve
pas qu'un workspace peut être provisionné. Les tests de création, démarrage,
arrêt, redémarrage, persistance, isolation, quotas et éditeur doivent être
exécutés contre une instance Coder et un provisioner réels avant toute annonce
de réussite.
