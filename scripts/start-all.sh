#!/bin/bash
# Démarre tous les microservices et le frontend en local
# Utilisation : ./start-all.sh
# Ctrl+C pour arrêter tous les services

set -e
cd "$(dirname "$0")/.."

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

NO_INFRA=false

# Traiter les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-infra)
            NO_INFRA=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         Démarrage de tous les microservices Ecopria          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Fichier .env manquant. Copiez .env.example vers .env${NC}"
    exit 1
fi

# ─── ÉTAPE 1 : INFRA DOCKER ────────────────────────────────────────
if [ "$NO_INFRA" = false ]; then
    echo -e "${CYAN}1️⃣  Démarrage infrastructure Docker (MySQL + Kafka)...${NC}"
    docker compose -f docker-compose.infra.yml up -d
    echo -e "${GREEN}   ✓ Infra démarrée${NC}"
    sleep 3
    echo ""
fi

# ─── ÉTAPE 2 : SERVICES BACKEND ────────────────────────────────────
echo -e "${CYAN}2️⃣  Démarrage services backend en parallèle...${NC}"

BACKEND_SERVICES=(
    "auth-service:8081:"
    "service-utilisateur:8082:-Dspring-boot.run.profiles=local"
    "service-action:9090:-Dspring-boot.run.profiles=local"
    "service-inscription:8084:-Dspring-boot.run.profiles=local"
    "service-presence:8085:-Dspring-boot.run.profiles=local"
    "service-recompense:8086:"
    "service-notification:8087:-Dspring-boot.run.profiles=local"
    "admin-service:8089:-Dspring-boot.run.profiles=local"
)

PIDS=()

for service_info in "${BACKEND_SERVICES[@]}"; do
    IFS=':' read -r name port profile <<< "$service_info"
    
    if [ ! -d "backend/$name" ]; then
        echo -e "${YELLOW}   ⚠️  $name introuvable${NC}"
        continue
    fi
    
    echo -e "${CYAN}   ▶️  $name... (port $port)${NC}"
    
    (
        cd "backend/$name"
        if [ -z "$profile" ]; then
            ./mvnw spring-boot:run > "/tmp/ecopria-$name.log" 2>&1 &
        else
            ./mvnw spring-boot:run "$profile" > "/tmp/ecopria-$name.log" 2>&1 &
        fi
        wait
    ) &
    
    PIDS+=($!)
    sleep 0.5
done

echo -e "${GREEN}   ✓ Services lancés en arrière-plan${NC}"
echo ""

# Attendre un peu pour le démarrage des services
echo -e "${YELLOW}   ⏳ Attente du démarrage des services (15s)...${NC}"
sleep 15

# ─── API GATEWAY ───────────────────────────────────────────────────
echo -e "${CYAN}2b️⃣  Démarrage API Gateway...${NC}"
if [ -d "backend/api-gateway" ]; then
    echo -e "${CYAN}   ▶️  api-gateway (port 8080)${NC}"
    (
        cd "backend/api-gateway"
        ./mvnw spring-boot:run > "/tmp/ecopria-api-gateway.log" 2>&1 &
        wait
    ) &
    PIDS+=($!)
    echo -e "${GREEN}   ✓ API Gateway lancée${NC}"
else
    echo -e "${YELLOW}   ⚠️  API Gateway introuvable${NC}"
fi
echo ""

# ─── ÉTAPE 3 : FRONTEND ────────────────────────────────────────────
echo -e "${CYAN}3️⃣  Démarrage du frontend Angular...${NC}"
if [ -d "frontend" ]; then
    echo -e "${CYAN}   ▶️  ng serve${NC}"
    (
        cd "frontend"
        npm install > /dev/null 2>&1 || true
        ng serve --open > "/tmp/ecopria-frontend.log" 2>&1 &
        wait
    ) &
    PIDS+=($!)
    echo -e "${GREEN}   ✓ Frontend lancé${NC}"
else
    echo -e "${YELLOW}   ⚠️  Dossier frontend introuvable${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✓ DÉMARRAGE COMPLET                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Services en cours d'exécution :${NC}"
echo -e "${GREEN}  API Gateway      http://localhost:8080${NC}"
echo -e "${GREEN}  Frontend         http://localhost:4200${NC}"
echo -e "${GREEN}  Kafka UI         http://localhost:8090${NC}"
echo -e "${GREEN}  phpMyAdmin       http://localhost:8888${NC}"
echo ""
echo -e "${CYAN}Services backend :${NC}"
echo "  auth-service              port 8081"
echo "  service-utilisateur       port 8082"
echo "  service-action            port 9090"
echo "  service-inscription       port 8084"
echo "  service-presence          port 8085"
echo "  service-recompense        port 8086"
echo "  service-notification      port 8087"
echo "  admin-service             port 8089"
echo ""
echo -e "${YELLOW}Logs disponibles dans /tmp/ecopria-*.log${NC}"
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter tous les services${NC}"
echo ""

# Gérer l'arrêt avec Ctrl+C
trap "echo ''; echo -e '${YELLOW}Arrêt des services...${NC}'; kill \${PIDS[@]} 2>/dev/null; wait; echo -e '${GREEN}Services arrêtés.${NC}'; exit 0" SIGINT

# Attendre que tous les processus se terminent
wait
