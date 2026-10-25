import os
import tempfile
import requests 
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel

app = FastAPI(title="AI Transcription Service")

model_size = os.getenv("WHISPER_MODEL", "small")
model = WhisperModel(model_size, device="cpu", compute_type="int8")

# endpoint para transcribir
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(tmp_path, beam_size=5, vad_filter=True)
        
        # 5. Unir los segmentos de texto en un solo string
        full_text = " ".join([segment.text for segment in segments])

        return {
            "filename": file.filename,
            "text": full_text,
            "language": info.language,
            "language_probability": info.language_probability
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Limpiamos el archivo temporal
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

class VideoUrlRequest(BaseModel):
    video_url: str

@app.post("/transcribe-url")
async def transcribe_from_url(request: VideoUrlRequest):
    tmp_path = None
    try:
        # Descargar el video desde GCS a un archivo temporal
        print(f"Descargando video desde: {request.video_url}")
        response = requests.get(request.video_url, stream=True)
        response.raise_for_status()

        # Guardar temporalmente en el servidor
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
            "language_probability": info.language_probability
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Limpiar el archivo temporal
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.get("/health")
def health_check():
    return {"status": "ok"}