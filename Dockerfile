# =============================================================================
# RentNest backend image
#
# Fixes carried over from the previous version of this file:
#   * built and ran on Java 21 while the pom targets Java 17
#   * exposed port 8080 while the application listens on 8081
#   * re-downloaded every dependency on each build because sources were copied
#     before the dependency resolution step
#   * ran as root
# =============================================================================

# ---- Stage 1: dependencies (cached independently of source changes) ---------
FROM maven:3.9-eclipse-temurin-17 AS deps
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# ---- Stage 2: build ---------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY --from=deps /root/.m2 /root/.m2
COPY pom.xml .
COPY src ./src
RUN mvn -B -q clean package -DskipTests \
    && mv target/*.jar target/app.jar

# ---- Stage 3: runtime -------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine AS runtime

# Never run application code as root inside a container.
RUN addgroup -S rentnest && adduser -S -G rentnest rentnest

WORKDIR /app
COPY --from=builder --chown=rentnest:rentnest /build/target/app.jar app.jar

USER rentnest

ENV SERVER_PORT=8081 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport"

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=45s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${SERVER_PORT}/actuator/health" | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
