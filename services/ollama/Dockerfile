FROM ollama/ollama:0.3.12

ENV OLLAMA_HOST=0.0.0.0:8080

# Iniciar Ollama temporalmente y descargamos el modelo durante el build
RUN ollama serve & sleep 5 && ollama pull llama3.2:3b

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/start.sh"]