#!/bin/bash
set -e

# Iniciar servidor de Ollama en segundo plano
ollama serve &

sleep 5

# Descargar  modelo 
echo "Descargando modelo..."
ollama pull llama3.2:3b

#Mantener  contenedor vivo esperando al proceso en segundo plano
wait