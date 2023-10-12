error:
	@echo "Please choose one of the following targets: build, deploy.{frontend,backend}, teardown"
	@exit 1

build:
	sam validate --lint
	sam build

deploy.backend: build
	sam deploy --no-confirm-changeset

deploy.frontend:
	./deploy_frontend.sh

teardown:
	sam delete

start:
	(cd frontend && npm start)