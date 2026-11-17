# Validation opérationnelle

## Vérifié dans le dépôt

- Sous-module Coder officiel présent avec commit d’origine.
- Sous-module Registry officiel présent avec commit d’origine.
- Templates Coder et Registry matérialisées sous `catalog/templates`.
- Modules Registry matérialisés sous `catalog/modules`.
- Scripts d’import, synchronisation, provenance et validation présents.
- API de relais vers les endpoints Coder officiels présente.
- Configurations Docker, Compose et Render présentes.
- Secrets exclus du dépôt par variables d’environnement.

## À exécuter sur une infrastructure réelle

- Démarrage de `coderd` avec PostgreSQL compatible.
- Authentification et création d’un compte selon la politique Coder.
- Organisation, équipe, rôle et permissions.
- Import et publication de templates dans Coder.
- Provisionnement d’un workspace Docker ou Kubernetes.
- Accès terminal, application Web et éditeur.
- Création et persistance d’un fichier.
- Arrêt manuel, redémarrage et autostop.
- Isolation entre deux identités.
- Quotas CPU, RAM, stockage et workspaces actifs.
- Health checks Render et communications privées.

Aucun élément de cette seconde section ne doit être présenté comme réussi sans logs ou résultat de test conservé.
