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

# Rendre le script mvnw exécutable et exécuter le build Maven pour créer le JAR
# Les tests sont désactivés pour accélérer la construction de l'image
RUN chmod +x mvnw && ./mvnw clean install -DskipTests && \
    cp target/*-SNAPSHOT.jar /build/app.jar

# =================================================================
#  ÉTAPE 2 : FINALE - Exécution avec JRE seulement
# =================================================================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# curl requis pour le healthcheck docker-compose
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# Copier le JAR depuis l'étape de build
COPY --from=builder /build/app.jar app.jar

# Donner les permissions à l'utilisateur non-root
RUN chown appuser:appgroup app.jar

# Basculer vers l'utilisateur non-root
USER appuser

# Port sur lequel l'application s'exécute (server.port: 8082)
EXPOSE 8082

# Commande pour démarrer l'application
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]