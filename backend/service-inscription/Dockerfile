FROM eclipse-temurin:21-jdk AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
COPY mvnw .
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw clean package -DskipTests && \
    cp target/*-SNAPSHOT.jar /build/app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
COPY --from=builder /build/app.jar app.jar
RUN chown appuser:appgroup app.jar
USER appuser
EXPOSE 8084
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]