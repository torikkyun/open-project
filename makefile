.PHONY: docker-dev docker-test

COMPOSE_DEV := docker compose -f docker/compose.dev.yml
COMPOSE_TEST := docker compose -f docker/compose.test.yml

docker-dev:
	$(COMPOSE_DEV) up -d --build
docker-test:
	$(COMPOSE_TEST) up -d --build
