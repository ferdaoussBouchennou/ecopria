FROM eclipse-temurin:21-jdk-jammy AS build
RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl unzip ca-certificates \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY .mvn .mvn
COPY mvnw .
COPY pom.xml .
COPY src ./src

RUN chmod +x mvnw && ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]