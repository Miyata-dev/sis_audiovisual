import os
import time
import asyncio
import tempfile
import requests
import httpx
import google.auth.transport.requests
import google.oauth2.id_token
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
 
app = FastAPI(title="AI Transcription Service")
 
model_size = os.getenv("WHISPER_MODEL", "small")
model = WhisperModel(model_size, device="cpu", compute_type="int8")
 
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434").rstrip("/")

# En Cloud Run ollama exige autenticacion, se envia un token de identidad.
# En local (http://) no se usa token.
_token_cache = {"value": None, "exp": 0.0}


def _fetch_ollama_token() -> str:
    req = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(req, OLLAMA_URL)


async def ollama_headers() -> dict:
    if not OLLAMA_URL.startswith("https://"):
        return {}
    # El token dura 1 hora, se reutiliza 50 minutos
    if not _token_cache["value"] or time.time() > _token_cache["exp"]:
        _token_cache["value"] = await asyncio.to_thread(_fetch_ollama_token)
        _token_cache["exp"] = time.time() + 50 * 60
    return {"Authorization": f"Bearer {_token_cache['value']}"}

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
 
REFUSAL = "Lo siento, solo puedo responder preguntas relacionadas con el contenido de esta sesión."

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
 
    try:
        segments, info = model.transcribe(tmp_path, beam_size=5, vad_filter=True)
        full_text = " ".join([segment.text for segment in segments])
 
        return {
            "filename": file.filename,
            "text": full_text,
            "language": info.language,
            "language_probability": info.language_probability,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
 
class VideoUrlRequest(BaseModel):
    video_url: str
 
@app.post("/transcribe-url")
async def transcribe_from_url(request: VideoUrlRequest):
    tmp_path = None
    try:
        print(f"Descargando video desde: {request.video_url}")
        response = requests.get(request.video_url, stream=True)
        response.raise_for_status()
 
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            for chunk in response.iter_content(chunk_size=8192):
                tmp.write(chunk)
            tmp_path = tmp.name
 
        print("Transcribiendo...")
        segments, info = model.transcribe(tmp_path, beam_size=5, vad_filter=True)
        full_text = " ".join([segment.text for segment in segments])
 
        return {
            "text": full_text,
            "language": info.language,
            "language_probability": info.language_probability,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
 
@app.get("/health")
def health_check():
    return {"status": "ok"}

class ChatRequest(BaseModel):
    pregunta: str
    contexto_transcripcion: str
 
async def ollama_chat(messages, options=None, timeout=600):
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": options or {},
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/chat", json=payload, headers=await ollama_headers()
        )
        response.raise_for_status()
        return response.json()["message"]["content"].strip()
 
async def es_sobre_la_sesion(pregunta: str, contexto: str) -> bool:
    """Filtro rapido: decide si la peticion tiene relacion con la sesion."""
    
    pregunta_limpia = pregunta.lower().replace("ó", "o").replace("í", "i")
    palabras_clave = ["sesion", "session", "video", "resumen", "acta", "hablaron", "trataron", "reunion"]
    
    if any(palabra in pregunta_limpia for palabra in palabras_clave):
        return True
    
    muestra = contexto[:800] 
    
    messages = [
        {
            "role": "system",
            "content": (
                "Eres un filtro estricto. Responde SOLO con 'SI' o 'NO'.\n"
                "Responde SI si el mensaje del usuario busca extraer información de un texto, "
                "pide analizar datos, o tiene relación con una reunión de trabajo.\n"
                "Responde NO solo si es una pregunta de cultura general, matemáticas, "
                "chistes o código de programación."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Texto de referencia:\n{muestra}\n\n"
                f"Mensaje del usuario: {pregunta}\n\n"
                "¿El mensaje pide información válida? Responde solo SI o NO."
            ),
        },
    ]
    try:
        respuesta = await ollama_chat(messages, {"temperature": 0, "num_predict": 3, "num_ctx": 4096}, timeout=120)
        return respuesta.upper().replace("Í", "I").startswith("SI")
    except Exception as e:
        print(f"Clasificador fallo, se continua igual: {e}")
        return True
  
SYSTEM_PROMPT = f"""Eres un asistente que SOLO responde preguntas sobre la transcripción de una sesión en video.
 
REGLAS:
1. Usa únicamente la información de la transcripción que se te entrega. No uses conocimiento externo.
2. Si el usuario pide un resumen o de qué trata el video, resume los temas principales.
3. Si la pregunta no tiene relación con la sesión (matemáticas, cultura general, programación, opiniones, etc.), responde exactamente: "{REFUSAL}"
4. Si la pregunta es sobre la sesión pero el dato no aparece en la transcripción, responde exactamente: "Lo siento, esa información no se discutió en esta sesión."
5. Responde siempre en español, de forma breve y clara. No inventes información."""
 
@app.post("/chat")
async def chat_con_transcripcion(request: ChatRequest):
    if not await es_sobre_la_sesion(request.pregunta, request.contexto_transcripcion):
        return {"pregunta": request.pregunta, "respuesta": REFUSAL}
 
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"--- INICIO DE LA TRANSCRIPCIÓN ---\n{request.contexto_transcripcion}\n"
                f"--- FIN DE LA TRANSCRIPCIÓN ---\n\n"
                f"Pregunta del usuario: {request.pregunta}\n\n"
                "Recuerda: responde solo con información de la transcripción."
            ),
        },
    ]
 
    try:
        respuesta_ia = await ollama_chat(messages, {"temperature": 0, "num_ctx": 8192})
        return {"pregunta": request.pregunta, "respuesta": respuesta_ia}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el LLM: {str(e)}")