# Build stage: compile Spring Boot backend with Maven and Java 21
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper & POM file
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

# Pre-fetch Maven dependencies
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build production jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# Runtime stage: minimal JRE 21 Alpine image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create persistent directory for uploads
RUN mkdir -p uploads && chmod 777 uploads

# Copy built JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]

