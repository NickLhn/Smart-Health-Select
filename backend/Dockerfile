# 后端 Dockerfile
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests -q || mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=builder /app/zhijian-start/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
