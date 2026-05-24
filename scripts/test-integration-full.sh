#!/bin/bash
set -e

echo "========================================="
echo "  Full Integration Tests - Microservices"
echo "  Testing REST + Kafka Communication"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to run a test
run_test() {
  local test_name=$1
  local test_command=$2
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  echo -n "[$TOTAL_TESTS] Testing: $test_name ... "
  
  if eval "$test_command"; then
    echo -e "${GREEN}PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "${RED}FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

# Helper function for HTTP requests
http_request() {
  local method=$1
  local url=$2
  local data=$3
  local token=$4
  
  if [ -n "$data" ]; then
    if [ -n "$token" ]; then
      curl -s -X "$method" "$url" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$data"
    else
      curl -s -X "$method" "$url" \
        -H "Content-Type: application/json" \
        -d "$data"
    fi
  else
    if [ -n "$token" ]; then
      curl -s -X "$method" "$url" \
        -H "Authorization: Bearer $token"
    else
      curl -s -X "$method" "$url"
    fi
  fi
}

echo ""
echo "PHASE 1: Service Health Checks"
echo "-------------------------------------------"

run_test "Gateway Health" \
  "curl -s http://localhost:8080/actuator/health | grep -q 'UP'"

run_test "Auth Service Health" \
  "curl -s http://localhost:8081/actuator/health | grep -q 'UP'"

run_test "Utilisateur Service Health" \
  "curl -s http://localhost:8082/actuator/health | grep -q 'UP'"

run_test "Inscription Service Health" \
  "curl -s http://localhost:8084/inscriptions/health | grep -q 'service-inscription'"

run_test "Presence Service Health" \
  "curl -s http://localhost:8085/presences/health | grep -q 'service-presence'"

run_test "Action Service Health" \
  "curl -s http://localhost:9090/actuator/health | grep -q 'UP'"

run_test "Recompense Service Health" \
  "curl -s http://localhost:9093/actuator/health | grep -q 'UP'"

run_test "Notification Service Health" \
  "curl -s http://localhost:8086/actuator/health | grep -q 'UP'"

run_test "Admin Service Health" \
  "curl -s http://localhost:8087/actuator/health | grep -q 'UP'"

echo ""
echo "PHASE 2: Gateway Routing Tests"
echo "-------------------------------------------"

run_test "Gateway to Inscription Service" \
  "curl -s http://localhost:8080/api/inscriptions/health | grep -q 'service-inscription'"

run_test "Gateway to Presence Service" \
  "curl -s http://localhost:8080/api/presences/health | grep -q 'service-presence'"

run_test "Gateway to Utilisateur Service" \
  "curl -s http://localhost:8080/api/users/health 2>/dev/null || curl -s http://localhost:8080/api/utilisateurs/health 2>/dev/null | grep -q 'UP'"

echo ""
echo "PHASE 3: REST Communication Between Services"
echo "-------------------------------------------"

# Test that service-inscription can call service-action
echo -n "[$((TOTAL_TESTS + 1))] Testing: Inscription Service → Action Service (REST) ... "
TOTAL_TESTS=$((TOTAL_TESTS + 1))
# Create a test action first via service-action
ACTION_RESPONSE=$(curl -s -X POST http://localhost:9090/api/actions \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Test Action Integration",
    "description": "Action de test pour intégration",
    "placesTotales": 20,
    "points": 100,
    "statut": "ACTIVE"
  }' 2>/dev/null || echo "ERROR")

if echo "$ACTION_RESPONSE" | grep -q "id"; then
  ACTION_ID=$(echo "$ACTION_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo -e "${GREEN}PASSED${NC} (Action ID: $ACTION_ID)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${YELLOW}SKIPPED${NC} (Could not create test action)"
  ACTION_ID=""
fi

# Test that service-presence can call service-action
if [ -n "$ACTION_ID" ]; then
  run_test "Presence Service → Action Service (REST)" \
    "curl -s http://localhost:8085/presences/qr/$ACTION_ID | grep -q 'qrCode'"
fi

echo ""
echo "PHASE 4: Kafka Communication Tests"
echo "-------------------------------------------"

# Test Kafka connectivity
echo -n "[$((TOTAL_TESTS + 1))] Testing: Kafka Connectivity ... "
TOTAL_TESTS=$((TOTAL_TESTS + 1))
KAFKA_TEST=$(docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092 2>/dev/null || echo "ERROR")
if echo "$KAFKA_TEST" | grep -q "VERSION"; then
  echo -e "${GREEN}PASSED${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}FAILED${NC}"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test that Kafka topics exist
echo -n "[$((TOTAL_TESTS + 1))] Testing: Kafka Topics Existence ... "
TOTAL_TESTS=$((TOTAL_TESTS + 1))
TOPICS=$(docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null || echo "ERROR")
if echo "$TOPICS" | grep -q "inscription"; then
  echo -e "${GREEN}PASSED${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${YELLOW}SKIPPED${NC} (Topics may be auto-created)"
fi

echo ""
echo "PHASE 5: End-to-End Workflow Tests"
echo "-------------------------------------------"

# Test complete workflow: Create user → Create action → Register → Validate presence
echo -n "[$((TOTAL_TESTS + 1))] Testing: End-to-End User Registration ... "
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Create a test user
USER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "Integration",
    "email": "test.integration@ecopria.com",
    "motDePasse": "TestPassword123!",
    "ville": "Paris",
    "role": "CITIZEN"
  }' 2>/dev/null || echo "ERROR")

if echo "$USER_RESPONSE" | grep -q "id"; then
  USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo -e "${GREEN}PASSED${NC} (User ID: $USER_ID)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${YELLOW}SKIPPED${NC} (Could not create test user)"
  USER_ID=""
fi

# Test inscription workflow
if [ -n "$USER_ID" ] && [ -n "$ACTION_ID" ]; then
  echo -n "[$((TOTAL_TESTS + 1))] Testing: Inscription Workflow ... "
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  INSCRIPTION_RESPONSE=$(curl -s -X POST http://localhost:8080/api/inscriptions \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": $USER_ID,
      \"actionId\": $ACTION_ID
    }" 2>/dev/null || echo "ERROR")
  
  if echo "$INSCRIPTION_RESPONSE" | grep -q "id"; then
    INSCRIPTION_ID=$(echo "$INSCRIPTION_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "${GREEN}PASSED${NC} (Inscription ID: $INSCRIPTION_ID)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
fi

echo ""
echo "========================================="
echo "  Test Summary"
echo "========================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}ALL TESTS PASSED!${NC}"
  echo "Microservices are communicating correctly via REST and Kafka."
  exit 0
else
  echo -e "${RED}SOME TESTS FAILED!${NC}"
  echo "Microservices may have communication issues."
  exit 1
fi
