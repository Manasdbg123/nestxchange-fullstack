# =============================================================================
# RentNest web client.
#
# The frontend previously had no image at all, so `docker compose up` brought
# up a backend with nothing to talk to it.
# =============================================================================

# ---- Build ------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Copy the lockfile first so `npm ci` is cached independently of source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines env vars at build time, so the API URL must be present here
# rather than in the runtime environment.
ARG VITE_API_BASE_URL=http://localhost:8081/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- Serve ------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
