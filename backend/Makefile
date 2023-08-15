TEMPLATE = template.yaml

.PHONY: build
build:
	sam validate --lint
	sam build --use-container

.PHONY: run
run: build
	sam local start-api

.PHONY: deploy
deploy: build
	sam deploy

.PHONY: teardown
teardown:
	sam delete

