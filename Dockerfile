FROM node:22.22.3-bookworm-slim AS frontend-build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/package.json
RUN CI=1 pnpm install --frozen-lockfile
COPY frontend ./frontend
RUN pnpm --filter portfoliopro-frontend build

FROM maven:3.9.9-eclipse-temurin-21 AS backend-build
WORKDIR /workspace
COPY backend/pom.xml backend/pom.xml
COPY backend/.mvn backend/.mvn
COPY backend/mvnw backend/mvnw
RUN chmod +x backend/mvnw && cd backend && ./mvnw -B dependency:go-offline
COPY backend/src backend/src
COPY --from=frontend-build /workspace/frontend/dist/frontend/browser /workspace/frontend/dist/frontend/browser
WORKDIR /workspace/backend
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app
COPY --from=backend-build /workspace/backend/target/portfoliopro-api-0.0.1-SNAPSHOT.jar /app/app.jar
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
