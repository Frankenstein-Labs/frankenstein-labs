.PHONY: catalog validate syntax

catalog:
\tbash scripts/import-catalog.sh

validate:
\tbash scripts/validate-catalog.sh

syntax:
\tnode --check services/api/server.mjs
\tnode --check services/worker/worker.mjs
