ARG PYTHON_VERSION
FROM python:${PYTHON_VERSION}

ENV LANG C.UTF-8
ENV PYTHONUNBUFFERED 1

RUN apt update -yq && apt install -yq netcat

RUN pip install --no-cache-dir --upgrade pipenv pip \
    && mkdir /app

WORKDIR /app

ADD Pipfile Pipfile.lock /app/

RUN pipenv install --deploy --system

COPY compose/django/*.sh /
RUN chmod +x /*.sh

ENTRYPOINT ["/entrypoint.sh"]
