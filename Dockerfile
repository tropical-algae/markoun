FROM node:24 AS frontend-builder

WORKDIR /app/web

ARG VITE_WEB_PORT=8000
ARG VITE_API_BASE_URL=/

ENV VITE_WEB_PORT=${VITE_WEB_PORT} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ .
RUN npm run build


FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.21 /uv /uvx /bin/

LABEL org.opencontainers.image.authors="tropical-algae tropicalalgae@gmail.com"

ENV PYTHONUNBUFFERED=1
ENV MEDIA_DELIVERY_MODE=nginx

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx ripgrep && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock poe_tasks.toml README.md ./
COPY welcome.md ./

RUN uv sync --frozen --no-default-groups --no-install-project

COPY ./src ./src

RUN uv sync --frozen --no-default-groups --no-editable

COPY --from=frontend-builder /app/web/dist /app/web

COPY nginx.conf /etc/nginx/nginx.conf
COPY scripts/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/app/entrypoint.sh"]
