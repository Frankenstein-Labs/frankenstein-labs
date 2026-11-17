# Frankenstein-Labs

Ce dépôt rassemble l’intégration source du véritable moteur open source [Coder](https://github.com/coder/coder) et de son [Registry](https://github.com/coder/registry) pour l’organisation Frankenstein-Labs.

Les dépôts officiels sont conservés comme sous-modules afin de préserver leur historique, leurs licences, leurs auteurs et leurs attributions. Frankenstein-Labs ne modifie pas les dépôts amont et ne remplace pas Coder par une implémentation fictive.

## Sources intégrées

- `vendor/coder` : serveur/control plane Coder, agent, CLI, API, gestion des utilisateurs, organisations, équipes, workspaces, templates, versions, provisionnement Terraform et cycle de vie.
- `vendor/registry` : modules et templates publiés dans le Coder Registry.

Les templates officielles Coder se trouvent dans `vendor/coder/examples/templates`. Les modules et templates Registry se trouvent dans `vendor/registry/registry`.

## Initialisation

```bash
git clone --recurse-submodules https://github.com/Frankenstein-Labs/frankenstein-labs.git
cd frankenstein-labs
git -C vendor/coder rev-parse HEAD
git -C vendor/registry rev-parse HEAD
```

Le serveur Coder doit être déployé sur une infrastructure durable avec PostgreSQL, un runtime Terraform et une infrastructure de calcul pour les workspaces. Aucun cloud provider n’est lancé automatiquement par ce dépôt. Les templates nécessitant des identifiants ou une infrastructure restent disponibles sans déclencher de dépense.

## Licences

Consultez les fichiers `LICENSE` et les notices présents dans chaque sous-module. Coder est distribué sous AGPL-3.0; les composants du Registry conservent leurs propres notices et licences. Toute redistribution ou modification doit respecter les obligations applicables, notamment la publication du code source correspondant lorsque la licence l’exige.
