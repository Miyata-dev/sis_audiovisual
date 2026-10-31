#!/bin/bash
set -e

# 1. Iniciar el servidor de Ollama en segundo plano
ollama serve &

sleep 5

# 3. Descargar el modelo 
echo "Descargando modelo..."
ollama pull llama3.2:3b

# 4. Mantener el contenedor vivo esperando al proceso en segundo plano
wait