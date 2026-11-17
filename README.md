# Frankenstein-Labs

Frankenstein-Labs est une intégration autour du véritable moteur open source [Coder](https://github.com/coder/coder) et de son [Registry](https://github.com/coder/registry). Coder reste responsable du control plane, des agents, des utilisateurs, organisations, équipes, workspaces, templates, versions, builds, Terraform, permissions et événements.

## Sources officielles

Les dépôts amont sont conservés comme sous-modules dans `vendor/coder` et `vendor/registry`, avec leurs historiques, auteurs, licences et attributions. Les fichiers sont aussi matérialisés directement afin d’être accessibles après un clonage normal :

- `catalog/templates/coder/` contient les exemples officiels de `coder/coder`.
- `catalog/templates/registry/<namespace>/` contient toutes les templates présentes dans le Registry au moment de la synchronisation.
- `catalog/modules/registry/<namespace>/` contient tous les modules présents dans le Registry au moment de la synchronisation.
- `catalog/index.json` conserve les commits source, chemins, licences détectées, fichiers et liens de provenance.

La synchronisation est relançable avec `scripts/sync-coder.sh`, `scripts/sync-registry.sh`, `scripts/import-templates.sh`, `scripts/import-modules.sh` et `scripts/import-catalog.sh`. Les scripts ne suppriment pas silencieusement les modifications locales : examinez le diff avant commit.

## API réelle et déploiement

`services/api` relaie les endpoints Coder sous `/api/coder/*` avec `Coder-Session-Token` côté serveur. Il ne fabrique ni utilisateurs ni workspaces. `services/worker` synchronise les sources et ne provisionne pas de cloud. `render.yaml`, `Dockerfile`, `docker-compose.yml`, `.env.example` et `docs/RENDER_DEPLOYMENT.md` préparent le déploiement Render avec serveur Coder durable, PostgreSQL, API et worker.

Coder et les workspaces exigent une infrastructure durable, PostgreSQL, un provisioner Terraform et un environnement de calcul. Render ne fournit pas automatiquement un socket Docker pour les workspaces; un hôte Docker ou un provisioner externe doit être configuré et testé. Les données utilisateur doivent rester sur des volumes persistants Coder, pas sur le disque éphémère des services API/worker.

## Initialisation

```bash
git clone --recurse-submodules https://github.com/Frankenstein-Labs/frankenstein-labs.git
cd frankenstein-labs
bash scripts/import-catalog.sh
bash scripts/validate-catalog.sh
```

Pour une exécution locale, renseignez `.env` à partir de `.env.example`, puis utilisez `docker compose up`. Les secrets doivent rester hors Git.

Voir [ARCHITECTURE.md](ARCHITECTURE.md), [docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md) et [VALIDATION.md](VALIDATION.md).
