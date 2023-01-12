export PIPENV_VERBOSITY=-1

# Dev utilities

develop:
	bin/setup.dev -y
	bin/dc up -d
	cd frontend && yarn start

deps:
	pipenv install
	bin/dc build
	cd frontend && yarn

docker_clean_build:
	bin/dc build --no-cache runserver

generate:
	pipenv run python manage.py graphql_schema
	cd frontend && yarn gen

clean_locks:
	rm -f Pipfile.lock frontend/yarn.lock || true
	pipenv lock --clear --verbose
	cd frontend && yarn

format:
	make fix-file-ownership
	make black
	make isort
	make autoflake
	make mypy

frontend_dev:
	cd frontend && yarn && yarn start

precommit:
	make format
	make generate
	make test

# CI Pipeline & Tests

test: # Runs both backend & frontend Tests
	pytest
	cd frontend && yarn test:nowatch

test_backend_coverage:
	pytest --cov=backend/apps --cov-config=.coveragerc --cov-report html --cov-report term
	echo "View coverage report: file://${PWD}/htmlcov/index.html"

test_backend_docker: # Only backend tests, within docker container
	bin/djtest

export_version:
	VERSION=$$(date | md5sum | awk '{print $1}')

# Data management & Backups

dump_fixtures:
	bin/djmanage dumpdata --natural-primary --natural-foreign --format json --indent 2 users

# Codebase Linting & Cleanup

clean:
	find . -name '*.pyc' -delete

fix-file-ownership: # Fix docker-created files that are owned by root user
	find . -uid 0 &>/dev/null && sudo chown -R ${USER}:${USER} .

mypy:
	pipenv run mypy

isort:
	pipenv run isort backend

flake8:
	pipenv run flake8

autoflake:
	pipenv run autoflake -r -i --expand-star-imports --remove-all-unused-imports --remove-duplicate-keys --remove-unused-variables --ignore-init-module-imports backend/apps/

black:
	pipenv run black backend wsgi.py manage.py

lint:
	pipenv run black --check backend wsgi.py manage.py
