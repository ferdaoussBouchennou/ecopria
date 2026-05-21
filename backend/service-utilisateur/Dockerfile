# =================================================================
#  ÉTAPE 1 : BUILDER - Compilation avec Maven et JDK
# =================================================================
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /build

# Copier les fichiers de build Maven et les sources
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

# Exécuter le build Maven pour créer le JAR
# Les tests sont désactivés pour accélérer la construction de l'image
RUN ./mvnw clean install -DskipTests

# =================================================================
#  ÉTAPE 2 : FINALE - Exécution avec JRE seulement
# =================================================================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# Copier le JAR depuis l'étape de build
COPY --from=builder /build/target/*.jar app.jar

# Donner les permissions à l'utilisateur non-root
RUN chown appuser:appgroup app.jar

# Basculer vers l'utilisateur non-root
USER appuser

# Exposer le port sur lequel l'application s'exécute à l'intérieur du conteneur
EXPOSE 8080

# Commande pour démarrer l'application
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]