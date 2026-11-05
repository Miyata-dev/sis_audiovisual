FROM ollama/ollama:0.3.12

# Metadata  
LABEL maintainer="equipo-sis-audiovisual" \
      description="Servicio Ollama (llama3.2:3b) para IA del sistema" \
      project="sis_audiovisual"

ENV OLLAMA_HOST=0.0.0.0:8080
ENV OLLAMA_NUM_PARALLEL=3
ENV OLLAMA_MAX_LOADED_MODELS=1

# Descarga el modelo durante el build: espera a que el servidor responda
# y hace fallar el build si el pull falla
RUN set -e; \
    ollama serve > /tmp/ollama.log 2>&1 & \
    pid=$!; \
    for i in $(seq 1 60); do ollama list > /dev/null 2>&1 && break; sleep 1; done; \
    ollama pull llama3.2:3b; \
    kill $pid

EXPOSE 8080

# Healthcheck 
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1