.PHONY: docker-dev docker-test migration-new migration-up migration-current migration-history migration-down seed check format

COMPOSE_DEV := docker compose -f docker/compose.dev.yml
COMPOSE_TEST := docker compose -f docker/compose.test.yml
ALEMBIC := /opt/venv/bin/alembic

docker-dev:
	$(COMPOSE_DEV) up -d --build
docker-test:
	$(COMPOSE_TEST) up -d --build
# Database migrations
migration-new:
	$(COMPOSE_DEV) exec api-dev $(ALEMBIC) revision --autogenerate -m "$(message)"
migration-up:
	$(COMPOSE_DEV) exec api-dev $(ALEMBIC) upgrade head
migration-current:
	$(COMPOSE_DEV) exec api-dev $(ALEMBIC) current
migration-history:
	$(COMPOSE_DEV) exec api-dev $(ALEMBIC) history
migration-down:
	$(COMPOSE_DEV) exec api-dev $(ALEMBIC) downgrade $(revision)

# Seed dữ liệu nền
seed:
	$(COMPOSE_DEV) exec api-dev /opt/venv/bin/python -m src.infra.db.seed

# Kiểm tra và định dạng bằng ruff
check:
	uv run ruff check --fix
format:
	uv run ruff format
