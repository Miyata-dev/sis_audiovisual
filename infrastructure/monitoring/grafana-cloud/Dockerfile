FROM grafana/grafana:11.6.0

LABEL maintainer="equipo-sis-audiovisual" \
      description="Grafana con Cloud Monitoring y Cloud Logging" \
      version="1.1"

USER 472

RUN grafana cli plugins install googlecloud-logging-datasource

ENV GF_SERVER_HTTP_PORT=3000 \
    GF_USERS_ALLOW_SIGN_UP=false \
    GF_AUTH_ANONYMOUS_ENABLED=false

COPY --chown=472:472 provisioning /etc/grafana/provisioning
COPY --chown=472:472 dashboards /var/lib/grafana/dashboards

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1