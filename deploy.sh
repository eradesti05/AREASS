#!/bin/bash

COMPOSE_BASE="-f docker-compose.yml"
COMPOSE_DEV="-f docker-compose.dev.yml"
COMPOSE_PROD="-f docker-compose.prod.yml"
COMPOSE_STAGING="-f docker-compose.staging.yml"

CMD_DEV="docker compose -p areass-dev $COMPOSE_BASE $COMPOSE_DEV"
CMD_PROD="docker compose -p areass-prod $COMPOSE_BASE $COMPOSE_PROD"
CMD_STAGING="docker compose -p areass-staging $COMPOSE_BASE $COMPOSE_STAGING"

case "$1" in
  dev)
    echo "Starting development environment..."
    $CMD_DEV down
    $CMD_DEV build --no-cache
    $CMD_DEV up -d
    echo "Done. Logs: $CMD_DEV logs -f"
    ;;

  prod)
    echo "Starting production environment..."
    $CMD_PROD down
    $CMD_PROD build --no-cache
    $CMD_PROD up -d
    echo "Done. Logs: $CMD_PROD logs -f"
    ;;

  staging)
    echo "Starting staging environment..."
    $CMD_STAGING down
    $CMD_STAGING build --no-cache
    $CMD_STAGING up -d
    echo "Done. Logs: $CMD_STAGING logs -f"
    ;;

  stop)
    case "$2" in
      dev)
        echo "Stopping development environment..."
        $CMD_DEV down
        echo "Done."
        exit 0
        ;;
      prod)
        echo "Stopping production environment..."
        $CMD_PROD down
        echo "Done."
        exit 0
        ;;
      staging)
        echo "Stopping staging environment..."
        $CMD_STAGING down
        echo "Done."
        exit 0
        ;;
      *)
        echo "stop who? dev|prod|staging"
        exit 1
        ;;
    esac
    ;;

  logs)
    # deploy.sh logs dev [service]
    # deploy.sh logs prod [service]
    # deploy.sh logs staging [service]
    ENV=$2
    SERVICE=$3
    if [ "$ENV" = "dev" ]; then
      $CMD_DEV logs -f $SERVICE
    elif [ "$ENV" = "prod" ]; then
      $CMD_PROD logs -f $SERVICE
    elif [ "$ENV" = "staging" ]; then
      $CMD_STAGING logs -f $SERVICE
    else
      echo "Usage: $0 logs [dev|prod|staging] [service]"
    fi
    ;;

  *)
    echo "Usage: $0 [dev|prod|staging|stop|logs]"
    echo ""
    echo "  dev                    Start development environment (lokal)"
    echo "  prod                   Start production environment"
    echo "  staging                Start staging environment"
    echo "  stop <env>             Stop an environment (dev|prod|staging)"
    echo "  logs <env> [service]   Tail logs (env: dev|prod|staging)"
    exit 1
    ;;
esac