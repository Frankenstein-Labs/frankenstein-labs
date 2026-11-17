# Validation opérationnelle

## Vérifié dans le dépôt (RÉUSSI)

- Sous-modules officiels Coder et Registry présents, commits épinglés.
- Templates Coder et Registry matérialisés sous `catalog/templates`.
- Modules Registry matérialisés sous `catalog/modules`.
- `catalog/index.json` déterministe : deux imports successifs produisent un
  fichier identique (aucun horodatage).
- `scripts/validate-catalog.sh` vérifie la structure de l'index et sa
  correspondance exacte avec les fichiers matérialisés.
- `node --test "tests/*.test.mjs"` : 14 tests passent (API + intégrité du
  catalogue).
- `bash -n` sur tous les scripts : OK.
- `render.yaml` et `docker-compose.yml` valides (YAML).
- Image API construite et exécutée : `/healthz` → `{"ok":true,...}` ;
  `/api/catalog` → 401 sans secret, 200 avec secret ; 404 et 405 corrects.
- Image Coder officielle (digest épinglé) : `/healthz` → `OK`,
  `terraform version` → `v1.17.2`, exécution en utilisateur non privilégié.
- Worker en conteneur : clone, synchronisation, import et indexation réussis
  (`WORKER_RUN_ONCE=1`).
- Secrets exclus du dépôt ; `.env` réel non suivi.

## À exécuter sur une infrastructure réelle (NON TESTÉ)

- Déploiement Render réel (compte, secrets, réseau privé).
- Démarrage de `coderd` avec PostgreSQL Render managé.
- Authentification, organisations, équipes, rôles et permissions.
- Import et publication de templates dans Coder.
- Provisionnement d'un workspace (Docker ou Kubernetes) via un backend de calcul
  externe.
- Accès terminal, application Web et éditeur.
- Création et persistance d'un fichier ; arrêt, redémarrage et autostop.
- Isolation entre deux identités ; quotas CPU, RAM, stockage.
- Sauvegarde et restauration PostgreSQL.

Aucun élément de cette seconde section ne doit être présenté comme réussi sans
logs ou résultat de test conservé.
