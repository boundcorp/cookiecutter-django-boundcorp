.PHONY: dev deps venv docker_build format test freeze clean

# Dev utilities
dev:
	make deps
	bin/dc up -d

deps:
	make venv
	make docker_build
	make frontend_deps

frontend_deps:
	cd frontend && npm install

docker_build:
	bin/dc build

docker_build_clean:
	bin/dc build --no-cache

format:
	ruff format .
	ruff check --fix .

venv:
	uv venv .venv
	uv pip install -e .

precommit:
	make format
	make test
	make freeze

freeze:
	uv pip freeze | grep -vE '^{{cookiecutter.project_name}}' > requirements.freeze.txt

# CI Pipeline & Tests
test:
	pytest

test_aio:
	bin/dc run --rm backend pytest --ds={{cookiecutter.project_name}}.settings.test_settings_aio -v

test_backend_coverage:
	pytest --cov={{cookiecutter.project_name}}/apps --cov-config=.coveragerc --cov-report html --cov-report term
	echo "View coverage report: file://$${PWD}/htmlcov/index.html"

# Data management
dump_fixtures:
	bin/djmanage dumpdata --natural-primary --natural-foreign --format json --indent 2 users

clean:
	find . -name '*.pyc' -delete
