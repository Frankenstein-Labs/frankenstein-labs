# Provenance et licences

Les deux répertoires sous `vendor/` sont des dépôts officiels conservés comme sous-modules Git. Leurs historiques et fichiers de licence restent dans leurs dépôts respectifs. Ne supprimez pas les notices lors d’une copie, d’un build ou d’une redistribution.

## Licences des composants

- `vendor/coder` (coder/coder) : **AGPL-3.0**. Les exemples matérialisés sous
  `catalog/templates/coder/` en héritent.
- `vendor/registry` (coder/registry) : **Apache-2.0**. Les templates et modules
  matérialisés sous `catalog/templates/registry/` et `catalog/modules/registry/`
  en héritent, sauf mention de licence propre dans le répertoire concerné.

## Métadonnées de provenance

`catalog/index.json` enregistre pour chaque template et module : le dépôt amont,
le commit source épinglé, l’URL de provenance, la licence détectée et la liste
des fichiers. La licence est déterminée à partir du fichier `LICENSE` du
répertoire quand il existe, sinon héritée de la licence du dépôt amont. Ces
métadonnées permettent de retrouver l’origine exacte de chaque fichier
matérialisé et de vérifier les obligations de redistribution.

Coder lui-même, ainsi que les templates qui l’utilisent, restent la propriété de
leurs auteurs respectifs ; ce dépôt ne fait que les intégrer et les référencer.
