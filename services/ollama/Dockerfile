FROM ollama/ollama:0.3.12

# puerto por defecto de ollama -> 11434

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 8080

# Ejecutar el script de inicio.
ENTRYPOINT ["/usr/local/bin/start.sh"]