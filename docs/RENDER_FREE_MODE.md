# Mode gratuit Render — Frankenstein-Labs

`render.catalog-free.yaml` est un blueprint de préparation uniquement. Il déploie seulement l’API/catalogue sous forme de web service gratuit. Il ne crée pas de service Coder, de PostgreSQL, de worker ni de backend de calcul.

Dans ce mode :

- `/healthz` peut confirmer que l’API démarre ;
- `/api/catalog` peut servir les 69 templates et 93 modules avec le secret API ;
- le proxy `/api/coder/*` reste indisponible tant que `CODER_INTERNAL_URL` et `CODER_SESSION_TOKEN` ne sont pas renseignés ;
- aucun workspace ne peut être créé, démarré, arrêté, redémarré ou supprimé ;
- aucune base métier n’est créée ;
- le service gratuit peut dormir entre deux requêtes et ne convient pas à un workflow de provisioning sensible à la latence.

Variables API nécessaires :

- `PORT=3000`
- `NODE_ENV=production`
- `CATALOG_INDEX=/app/catalog/index.json`
- `FRANKENSTEIN_API_SECRET`, généré par le fournisseur et jamais committé

Variables volontairement non configurées en mode gratuit :

- `CODER_INTERNAL_URL`
- `CODER_SESSION_TOKEN`
- `FRANKENSTEIN_DATABASE_URL`

Pour le dashboard Vercel, les variables doivent être définies côté serveur uniquement :

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` : valeur publique Clerk ;
- `CLERK_SECRET_KEY` : secret serveur Clerk ;
- `FRANKENSTEIN_API_URL` : URL de l’API catalogue ;
- `FRANKENSTEIN_API_SECRET` : même secret que l’API, dans les variables serveur Vercel uniquement ;
- `NEXT_PUBLIC_APP_URL` : URL HTTPS publique pour `metadataBase` ;
- `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ORG`, `NEXT_PUBLIC_SENTRY_PROJECT` si Sentry est activé ;
- `SENTRY_AUTH_TOKEN` uniquement si l’upload de source maps est activé pendant le build.

Ne pas configurer `FRANKENSTEIN_API_SECRET`, `CLERK_SECRET_KEY`, `CODER_SESSION_TOKEN` ou un DSN PostgreSQL comme variable `NEXT_PUBLIC_*`.
