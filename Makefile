.PHONY: catalog validate syntax publish-templates backup

catalog:
\tbash scripts/import-catalog.sh

validate:
\tbash scripts/validate-catalog.sh

syntax:
\tnode --check services/api/server.mjs
\tnode --check services/worker/worker.mjs

publish-templates:
\tbash scripts/publish-templates.sh

backup:
\tbash scripts/backup-coder-db.sh
