#!/bin/bash
set -e

# Timeout after 600 seconds (10 minutes)
TIMEOUT=600
ELAPSED=0
INTERVAL=5

echo "Starting readiness checks for services..."

# 1. Wait for MySQL databases and Kafka to be healthy
DB_CONTAINERS=(
  "mysql-auth"
  "mysql-utilisateur"
  "mysql-action"
  "mysql-inscription"
  "mysql-presence"
  "mysql-recompense"
  "mysql-admin"
  "mysql-notification"
  "kafka"
)

wait_for_docker_health() {
  local container=$1
  echo -n "Waiting for container '$container' to be healthy..."
  while true; do
    STATUS=$(docker inspect --format='{{json .State.Health.Status}}' "$container" 2>/dev/null || echo "\"unknown\"")
    # Strip quotes
    STATUS=${STATUS%\"}
    STATUS=${STATUS#\"}

    if [ "$STATUS" = "healthy" ]; then
      echo " OK"
      return 0
    fi

    if [ $ELAPSED -ge $TIMEOUT ]; then
      echo "TIMEOUT! Container '$container' is not healthy (Status: $STATUS)."
      return 1
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
  done
}

for container in "${DB_CONTAINERS[@]}"; do
  wait_for_docker_health "$container" || exit 1
done

# 2. Wait for Java microservices to respond to HTTP health checks
# Syntax: URL|NAME
HTTP_SERVICES=(
  "http://localhost:8080/actuator/health|api-gateway"
  "http://localhost:8081/actuator/health|service-auth"
  "http://localhost:8082/actuator/health|service-utilisateur"
  "http://localhost:8086/actuator/health|service-notification"
  "http://localhost:8084/inscriptions/health|service-inscription"
  "http://localhost:8085/presences/health|service-presence"
  "http://localhost:9090/actuator/health|service-action"
  "http://localhost:9093/actuator/health|service-recompense"
  "http://localhost:8087/actuator/health|admin-service"
)

wait_for_http() {
  local url=$1
  local name=$2
  echo -n "Waiting for microservice '$name' to be UP at $url..."
  while true; do
    RESPONSE=$(curl -s -L -w "%{http_code}" -o /dev/null --connect-timeout 2 "$url" || echo "000")

    if [ "$RESPONSE" = "200" ]; then
      echo " OK"
      return 0
    fi

    if [ $ELAPSED -ge $TIMEOUT ]; then
      echo "TIMEOUT! Microservice '$name' is not responding with HTTP 200 (Got: $RESPONSE)."
      return 1
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
  done
}

for service in "${HTTP_SERVICES[@]}"; do
  IFS='|' read -r url name <<< "$service"
  wait_for_http "$url" "$name" || exit 1
done

echo "All services are up and healthy!"
exit 0
