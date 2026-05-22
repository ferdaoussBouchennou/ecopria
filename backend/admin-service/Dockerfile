# ecopria-admin-service — port 8087 (CI: ferdaoussbo/ecopria-admin-service)
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
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser
COPY --from=builder /build/app.jar app.jar
RUN chown appuser:appgroup app.jar
USER appuser
EXPOSE 8087
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]