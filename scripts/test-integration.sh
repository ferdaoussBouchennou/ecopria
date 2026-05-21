#!/bin/bash
set -e

echo "========================================="
echo " Running Integration Tests via Gateway "
echo "========================================="

# Helper function to check health via curl
check_health() {
  local url=$1
  local expected_status=$2
  echo "Checking endpoint: $url"
  
  # Fetch both http code and response body
  RESPONSE_FILE=$(mktemp)
  HTTP_CODE=$(curl -s -L -w "%{http_code}" -o "$RESPONSE_FILE" "$url" || echo "000")
  RESPONSE_BODY=$(cat "$RESPONSE_FILE")
  rm -f "$RESPONSE_FILE"
  
  echo "HTTP Code: $HTTP_CODE"
  echo "Response Body: $RESPONSE_BODY"
  
  if [ "$HTTP_CODE" != "200" ]; then
    echo "ERROR: Expected HTTP 200, got $HTTP_CODE"
    return 1
  fi
  
  if [[ ! "$RESPONSE_BODY" =~ "$expected_status" ]]; then
    echo "ERROR: Expected body to contain '$expected_status'"
    return 1
  fi
  
  echo "Success!"
  echo "-----------------------------------------"
  return 0
}

# 1. Test Gateway directly
check_health "http://localhost:8080/actuator/health" "UP" || exit 1

# 2. Test direct microservice endpoints
check_health "http://localhost:8084/inscriptions/health" "service-inscription" || exit 1
check_health "http://localhost:8085/presences/health" "service-presence" || exit 1

# 3. Test Routing through Gateway
check_health "http://localhost:8080/api/inscriptions/health" "service-inscription" || exit 1
check_health "http://localhost:8080/api/presences/health" "service-presence" || exit 1

echo "INTEGRATION TESTS PASSED SUCCESSFULLY!"
exit 0
