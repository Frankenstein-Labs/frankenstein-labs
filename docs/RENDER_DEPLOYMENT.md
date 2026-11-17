# Déploiement Render

Le fichier `render.yaml` prépare quatre composants : un service privé pour le serveur officiel Coder, une base PostgreSQL Render, l’API Frankenstein-Labs et un worker de synchronisation. La configuration est volontairement non destructive : les templates et modules sont synchronisés depuis les sources officielles, mais aucun workspace ni fournisseur cloud n’est provisionné par le worker.

## Prérequis

Renseignez les secrets Render `CODER_ACCESS_URL`, `CODER_PG_CONNECTION_URL`, `CODER_SESSION_TOKEN`, `FRANKENSTEIN_API_SECRET` et, si nécessaire, les variables de stockage et `CORTEX_API_URL`. Ne commitez jamais ces valeurs. `CODER_PG_CONNECTION_URL` doit pointer vers PostgreSQL avec les paramètres TLS et de connexion attendus par la version Coder déployée.

Le serveur Coder doit pouvoir atteindre un provisioner Terraform et l’infrastructure où les workspaces seront exécutés. Un service Render ne fournit pas automatiquement un socket Docker utilisable pour créer des workspaces Docker. Pour Docker, utilisez un hôte Docker externe ou un provisioner adapté; ne marquez pas le provisionnement comme opérationnel sans test réel.

## Déploiement

1. Créez le blueprint Render à partir de `render.yaml`.
2. Vérifiez la base PostgreSQL et la connectivité privée entre les services.
3. Configurez `CODER_ACCESS_URL` avec l’URL HTTPS publique du control plane.
4. Configurez les politiques Coder d’utilisateurs, équipes, templates, quotas, autostop et permissions.
5. Démarrez l’API et vérifiez `/healthz`.
6. Exécutez `scripts/render-deploy-check.sh` depuis un environnement autorisé.
7. Testez d’abord un template minimal sur une infrastructure de test dédiée.

## Persistance

PostgreSQL conserve les données du control plane. Les fichiers de workspaces ne doivent pas être écrits dans le disque éphémère de l’API ou du worker. Configurez les volumes persistants au niveau du template Coder et de l’infrastructure de workspace. L’arrêt d’un workspace ne doit pas supprimer son volume; la suppression explicite doit être une opération distincte et avertie.

## Santé et limites

`/healthz` vérifie uniquement que l’API Frankenstein-Labs répond et indique si les variables Coder sont configurées. `render-healthcheck.sh` ne prouve pas qu’un workspace peut être provisionné. Les tests de création, démarrage, arrêt, redémarrage, persistance, isolation, quotas et éditeur doivent être exécutés contre une instance Coder et un provisioner réels avant toute annonce de réussite.
