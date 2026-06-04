#!/bin/bash

# ============================================
# Script Bash - Test API Échange de Points
# ============================================
# Ce script teste le flux complet d'échange de points

# Configuration
USER_ID=1
PARTNER_USER_ID=2
BASE_URL_USER="http://localhost:8082"
BASE_URL_REWARD="http://localhost:8084"
BASE_URL_GATEWAY="http://localhost:8080"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}==================================${NC}"
echo -e "${CYAN}TEST SYSTÈME D'ÉCHANGE DE POINTS${NC}"
echo -e "${CYAN}==================================${NC}"
echo ""

# ============================================
# 1. Vérifier les points de l'utilisateur
# ============================================
echo -e "${YELLOW}1. Vérification du solde de points...${NC}"
echo -e "${GRAY}   URL: GET $BASE_URL_USER/api/utilisateurs/$USER_ID/points${NC}"

response=$(curl -s "$BASE_URL_USER/api/utilisateurs/$USER_ID/points")
if [ $? -eq 0 ]; then
    points_avant=$(echo $response | jq -r '.totalPoints')
    echo -e "${GREEN}   ✓ Solde actuel: $points_avant points${NC}"
else
    echo -e "${RED}   ✗ Erreur lors de la récupération des points${NC}"
    exit 1
fi

echo ""

# ============================================
# 2. Consulter le catalogue des offres
# ============================================
echo -e "${YELLOW}2. Consultation du catalogue des offres...${NC}"
echo -e "${GRAY}   URL: GET $BASE_URL_REWARD/api/recompenses${NC}"

offres=$(curl -s "$BASE_URL_REWARD/api/recompenses")
if [ $? -ne 0 ]; then
    echo -e "${RED}   ✗ Erreur lors de la récupération des offres${NC}"
    exit 1
fi

nb_offres=$(echo $offres | jq '. | length')
echo -e "${GREEN}   ✓ Nombre d'offres disponibles: $nb_offres${NC}"

if [ "$nb_offres" -eq 0 ]; then
    echo -e "${YELLOW}   ⚠ Aucune offre disponible pour tester l'échange${NC}"
    exit 1
fi

# Afficher les 3 premières offres
echo ""
echo -e "${CYAN}   Offres disponibles:${NC}"
echo $offres | jq -r '.[:3] | .[] | "   - ID: \(.id) | \(.title) | \(.pointsNecessaires) points | Type: \(.type)"'

# Sélectionner la première offre que l'utilisateur peut se permettre
offre_choisie=$(echo $offres | jq -r --arg points "$points_avant" '.[] | select(.pointsNecessaires <= ($points | tonumber) and .isActive == true) | . | @json' | head -n 1)

if [ -z "$offre_choisie" ]; then
    echo ""
    echo -e "${YELLOW}   ⚠ Aucune offre accessible avec $points_avant points${NC}"
    exit 1
fi

offre_id=$(echo $offre_choisie | jq -r '.id')
offre_title=$(echo $offre_choisie | jq -r '.title')
offre_points=$(echo $offre_choisie | jq -r '.pointsNecessaires')
offre_partenaire=$(echo $offre_choisie | jq -r '.partenaireName')

echo ""
echo -e "${CYAN}   → Offre sélectionnée pour l'échange:${NC}"
echo -e "     ID: $offre_id"
echo -e "     Titre: $offre_title"
echo -e "     Points nécessaires: $offre_points"
echo -e "     Partenaire: $offre_partenaire"

echo ""

# ============================================
# 3. Échanger des points contre l'offre
# ============================================
echo -e "${YELLOW}3. Échange de points contre l'offre...${NC}"
echo -e "${GRAY}   URL: POST $BASE_URL_REWARD/api/recompenses/echanger${NC}"

coupon=$(curl -s -X POST "$BASE_URL_REWARD/api/recompenses/echanger" \
    -H "X-User-Id: $USER_ID" \
    -H "Content-Type: application/json" \
    -d "{\"recompenseId\": $offre_id}")

if [ $? -eq 0 ] && [ "$(echo $coupon | jq -r '.code')" != "null" ]; then
    echo -e "${GREEN}   ✓ Échange réussi!${NC}"
    echo ""
    echo -e "${CYAN}   🎟️  CODE COUPON GÉNÉRÉ:${NC}"
    echo -e "${CYAN}   ════════════════════════${NC}"
    
    code_genere=$(echo $coupon | jq -r '.code')
    coupon_title=$(echo $coupon | jq -r '.recompenseTitle')
    coupon_partenaire=$(echo $coupon | jq -r '.partenaireName')
    coupon_points=$(echo $coupon | jq -r '.pointsUtilises')
    coupon_status=$(echo $coupon | jq -r '.status')
    coupon_expire=$(echo $coupon | jq -r '.expireLe')
    
    echo -e "${YELLOW}   Code: $code_genere${NC}"
    echo -e "   Offre: $coupon_title"
    echo -e "   Partenaire: $coupon_partenaire"
    echo -e "   Points utilisés: $coupon_points"
    echo -e "   Statut: $coupon_status"
    echo -e "   Expire le: $coupon_expire"
    echo -e "${CYAN}   ════════════════════════${NC}"
else
    echo -e "${RED}   ✗ Erreur lors de l'échange${NC}"
    echo -e "${RED}   Détails: $coupon${NC}"
    exit 1
fi

echo ""

# ============================================
# 4. Vérifier le nouveau solde
# ============================================
echo -e "${YELLOW}4. Vérification du nouveau solde...${NC}"

sleep 2  # Attendre que Kafka propage l'événement

response=$(curl -s "$BASE_URL_USER/api/utilisateurs/$USER_ID/points")
points_apres=$(echo $response | jq -r '.totalPoints')
points_deduits=$((points_avant - points_apres))

echo -e "${GRAY}   Solde avant: $points_avant points${NC}"
echo -e "${GRAY}   Solde après: $points_apres points${NC}"
echo -e "${GREEN}   ✓ Points déduits: $points_deduits points${NC}"

echo ""

# ============================================
# 5. Consulter mes coupons
# ============================================
echo -e "${YELLOW}5. Consultation de mes coupons...${NC}"

mes_coupons=$(curl -s "$BASE_URL_REWARD/api/recompenses/mes-coupons" \
    -H "X-User-Id: $USER_ID")

if [ $? -eq 0 ]; then
    nb_coupons=$(echo $mes_coupons | jq '. | length')
    echo -e "${GREEN}   ✓ Nombre de coupons: $nb_coupons${NC}"
    
    if [ "$nb_coupons" -gt 0 ]; then
        echo ""
        echo -e "${CYAN}   Liste des coupons (5 premiers):${NC}"
        echo $mes_coupons | jq -r '.[:5] | .[] | "   - \(.code) | \(.recompenseTitle) | Statut: \(.status)"'
    fi
fi

echo ""
echo ""

# ============================================
# 6. TEST PARTENAIRE - Valider le coupon
# ============================================
echo -e "${CYAN}==================================${NC}"
echo -e "${CYAN}TEST ESPACE PARTENAIRE${NC}"
echo -e "${CYAN}==================================${NC}"
echo ""

echo -e "${YELLOW}6. Validation du code coupon par le partenaire...${NC}"
echo -e "   Code à valider: $code_genere"
echo -e "   Partenaire User ID: $PARTNER_USER_ID"
echo ""

read -p "   Voulez-vous tester la validation du coupon ? (O/N): " continuer

if [ "$continuer" == "O" ] || [ "$continuer" == "o" ]; then
    
    coupon_valide=$(curl -s -X POST "$BASE_URL_REWARD/api/partenaire/valider-coupon" \
        -H "X-User-Id: $PARTNER_USER_ID" \
        -H "Content-Type: application/json" \
        -d "{\"code\": \"$code_genere\"}")
    
    if [ "$(echo $coupon_valide | jq -r '.status')" == "UTILISE" ]; then
        echo -e "${GREEN}   ✓ Coupon validé avec succès!${NC}"
        echo ""
        echo -e "${CYAN}   📋 DÉTAILS DE LA VALIDATION:${NC}"
        echo -e "${CYAN}   ════════════════════════════${NC}"
        echo -e "   Code: $(echo $coupon_valide | jq -r '.code')"
        echo -e "${YELLOW}   Statut: $(echo $coupon_valide | jq -r '.status')${NC}"
        echo -e "   Validé le: $(echo $coupon_valide | jq -r '.valideLe')"
        echo -e "${CYAN}   ════════════════════════════${NC}"
    else
        echo -e "${RED}   ✗ Erreur lors de la validation${NC}"
        echo -e "${RED}   Détails: $coupon_valide${NC}"
    fi
    
    echo ""
    
    # ============================================
    # 7. Essayer de valider à nouveau (doit échouer)
    # ============================================
    echo -e "${YELLOW}7. Test de double utilisation (doit échouer)...${NC}"
    
    double_validation=$(curl -s -X POST "$BASE_URL_REWARD/api/partenaire/valider-coupon" \
        -H "X-User-Id: $PARTNER_USER_ID" \
        -H "Content-Type: application/json" \
        -d "{\"code\": \"$code_genere\"}")
    
    if [ "$(echo $double_validation | jq -r '.status')" == "UTILISE" ]; then
        echo -e "${RED}   ✗ ERREUR: Le coupon a pu être validé deux fois!${NC}"
    else
        echo -e "${GREEN}   ✓ Double utilisation correctement bloquée${NC}"
        echo -e "${GRAY}   Message: $(echo $double_validation | jq -r '.message // .')${NC}"
    fi
    
else
    echo -e "${GRAY}   ⊳ Validation du coupon ignorée${NC}"
    echo ""
    echo -e "${CYAN}   Pour valider manuellement, utilisez:${NC}"
    echo -e "   curl -X POST $BASE_URL_REWARD/api/partenaire/valider-coupon \\"
    echo -e "     -H \"Content-Type: application/json\" \\"
    echo -e "     -H \"X-User-Id: $PARTNER_USER_ID\" \\"
    echo -e "     -d '{\"code\":\"$code_genere\"}'"
fi

echo ""
echo ""

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo -e "${CYAN}==================================${NC}"
echo -e "${CYAN}RÉSUMÉ DU TEST${NC}"
echo -e "${CYAN}==================================${NC}"
echo ""
echo -e "${GREEN}✓ Vérification des points: OK${NC}"
echo -e "${GREEN}✓ Consultation du catalogue: OK${NC}"
echo -e "${GREEN}✓ Échange de points: OK${NC}"
echo -e "${GREEN}✓ Génération du code: $code_genere${NC}"
echo ""
echo -e "Points avant: $points_avant"
echo -e "Points après: $points_apres"
echo -e "Points déduits: $points_deduits"
echo ""
echo -e "Offre échangée: $offre_title"
echo -e "Partenaire: $offre_partenaire"
echo ""
echo -e "${CYAN}==================================${NC}"
echo ""

echo -e "${CYAN}📝 Pour plus de détails, consultez:${NC}"
echo -e "   - GUIDE-TEST-ECHANGE-POINTS.md"
echo -e "   - test-points-echange.sql (requêtes SQL)"
echo ""
