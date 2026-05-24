# ecopria-auth-service — port 8081 (CI: ferdaoussbo/ecopria-auth-service)
# =================================================================
#  ÉTAPE 1 : BUILDER - Compilation avec Maven et JDK
# =================================================================
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /build
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src
RUN chmod +x mvnw && ./mvnw clean package -DskipTests && \
    cp target/*-SNAPSHOT.jar /build/app.jar

# =================================================================
#  ÉTAPE 2 : FINALE - Exécution avec JRE seulement
# =================================================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# curl requis pour le healthcheck docker-compose
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser
COPY --from=builder /build/app.jar app.jar
RUN chown appuser:appgroup app.jar
USER appuser
EXPOSE 8081
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]