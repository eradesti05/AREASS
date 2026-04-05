#!/bin/bash

COMPOSE_BASE="-f docker-compose.yml"
COMPOSE_DEV="-f docker-compose.dev.yml"
COMPOSE_PROD="-f docker-compose.prod.yml"

case "$1" in
  dev)
    echo "Starting development environment..."
    docker compose $COMPOSE_BASE $COMPOSE_DEV down
    docker compose $COMPOSE_BASE $COMPOSE_DEV build --no-cache
    docker compose $COMPOSE_BASE $COMPOSE_DEV up -d
    echo "Done. Logs: docker compose $COMPOSE_BASE $COMPOSE_DEV logs -f"
    ;;

  prod)
    echo "Starting production environment..."
    docker compose $COMPOSE_BASE $COMPOSE_PROD down
    docker compose $COMPOSE_BASE $COMPOSE_PROD build --no-cache
    docker compose $COMPOSE_BASE $COMPOSE_PROD up -d
    echo "Done. Logs: docker compose $COMPOSE_BASE $COMPOSE_PROD logs -f"
    ;;

  stop)
    echo "Stopping all environments..."
    docker compose $COMPOSE_BASE $COMPOSE_DEV down 2>/dev/null
    docker compose $COMPOSE_BASE $COMPOSE_PROD down 2>/dev/null
    echo "Done."
    ;;

  logs)
    # deploy.sh logs dev [service]
    # deploy.sh logs prod [service]
    ENV=$2
    SERVICE=$3
    if [ "$ENV" = "dev" ]; then
      docker compose $COMPOSE_BASE $COMPOSE_DEV logs -f $SERVICE
    elif [ "$ENV" = "prod" ]; then
      docker compose $COMPOSE_BASE $COMPOSE_PROD logs -f $SERVICE
    else
      echo "Usage: $0 logs [dev|prod] [service]"
    fi
    ;;

  *)
    echo "Usage: $0 [dev|prod|stop|logs]"
    echo ""
    echo "  dev          Start development environment"
    echo "  prod         Start production environment"
    echo "  stop         Stop all environments"
    echo "  logs <env> [service]   Tail logs (env: dev|prod)"
    exit 1
    ;;
esac