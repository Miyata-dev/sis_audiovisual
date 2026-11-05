FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runner

# Metadata
LABEL maintainer="equipo-sis-audiovisual" \
      description="Frontend React servido con Nginx unprivileged" \
      project="sis_audiovisual"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 8080 (el puerto por defecto de la imagen unprivileged)
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1