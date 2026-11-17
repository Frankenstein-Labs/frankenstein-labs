.PHONY: catalog validate syntax test publish-templates backup

catalog:
	bash scripts/import-catalog.sh

validate:
	bash scripts/validate-catalog.sh

syntax:
	node --check services/api/server.mjs
	node --check services/worker/worker.mjs
	node --check scripts/generate-catalog-index.mjs

test:
	node --test "tests/*.test.mjs"

publish-templates:
	bash scripts/publish-templates.sh

backup:
	bash scripts/backup-coder-db.sh
