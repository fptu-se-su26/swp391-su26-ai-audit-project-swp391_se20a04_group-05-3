# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy Maven POM and download dependencies first to optimize cache layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source files and package the jar
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Set up a secure non-root user and group
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copy the final built executable JAR from build container
COPY --from=builder /build/target/greenlife-backend-0.0.1-SNAPSHOT.jar app.jar

# Create and grant permissions to uploads directory for persistent volumes
USER root
RUN mkdir -p /app/uploads && chown -R spring:spring /app/uploads /app
USER spring:spring

# Expose backend port
EXPOSE 8080

# Default environment configurations
ENV SPRING_PROFILES_ACTIVE=prod
ENV UPLOAD_DIR=/app/uploads

ENTRYPOINT ["java", "-jar", "app.jar"]
