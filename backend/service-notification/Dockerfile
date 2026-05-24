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

# Rendre le script mvnw exécutable (important pour Windows/Linux compatibility)
RUN chmod +x mvnw

# Exécuter le build Maven pour créer le JAR
RUN ./mvnw clean install -DskipTests && \
    cp target/*-SNAPSHOT.jar /build/app.jar

# =================================================================
#  ÉTAPE 2 : FINALE - Exécution avec JRE seulement
# =================================================================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# curl requis pour le healthcheck docker-compose
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copier le JAR généré lors de l'étape de build
COPY --from=builder /build/app.jar app.jar

# Port exposé par le service (défini dans application.yaml → server.port: 8086)
EXPOSE 8086

# Commande de démarrage
ENTRYPOINT ["java", "-jar", "app.jar"]
