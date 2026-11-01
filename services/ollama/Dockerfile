FROM ollama/ollama:0.3.12

ENV OLLAMA_HOST=0.0.0.0:8080

# Descarga el modelo durante el build: espera a que el servidor responda
# y hace fallar el build si el pull falla
RUN set -e; \
    ollama serve > /tmp/ollama.log 2>&1 & \
    pid=$!; \
    for i in $(seq 1 60); do ollama list > /dev/null 2>&1 && break; sleep 1; done; \
    ollama pull llama3.2:3b; \
    kill $pid

EXPOSE 8080