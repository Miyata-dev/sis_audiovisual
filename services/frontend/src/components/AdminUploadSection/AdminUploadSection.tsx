import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { LOCAL_STORAGE_KEYS } from '../../constants/localStorage/keys';

interface Props {
  sessionId: number;
  onUploadSuccess?: () => void;
}

// Intenta leer la duracion en el navegador (para videos pequenos) y si no puede, devuelve undefined. El backend siempre calcula la duración con ffmpeg
const getVideoDuration = (file: File): Promise<number | undefined> =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (value?: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => done(undefined), 4000);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      clearTimeout(timer);
      done(Number.isFinite(video.duration) ? video.duration : undefined);
    };
    video.onerror = () => {
      clearTimeout(timer);
      done(undefined);
    };
    video.src = url;
  });

const guessVideoContentType = (file: File): string => {
  if (file.type) return file.type;
  if (file.name.toLowerCase().endsWith('.mkv')) return 'video/x-matroska';
  return 'video/mp4';
};

export const AdminUploadSection = ({ sessionId, onUploadSuccess }: Props) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  if (user?.role !== 'ADMIN' && user?.role !== 'PRESIDENTE') return null;

  const authHeaders = () => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // sube directo al bucket con URL firmada, sin pasar por el backend
  const uploadVideoDirect = async (file: File) => {
    const contentType = guessVideoContentType(file);

    // pedir URL firmada al backend
    const { data: target } = await axios.post(
      `/api/sessions/${sessionId}/video-upload-url`,
      { filename: file.name, contentType },
      { headers: authHeaders() },
    );

    // subir directo al bucket. Sin header Authorization, la firma va en la URL
    await axios.put(target.uploadUrl, file, {
      headers: { 'Content-Type': contentType },
      onUploadProgress: (e) =>
        setProgress(Math.round((e.loaded * 100) / (e.total || file.size))),
    });

    // avisar al backend que termino, registra el video y dispara la transcripción
    const durationSeconds = await getVideoDuration(file);
    await axios.post(
      `/api/sessions/${sessionId}/video-uploaded`,
      { objectName: target.objectName, durationSeconds },
      { headers: authHeaders() },
    );
  };

  // Archivos pequenos, igual que antes, a traves del backend
  const uploadSmallFile = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    await axios.post(`/api/sessions/${sessionId}/upload-${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeaders(),
      },
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    setProgress(null);
    setMessage('');

    try {
      if (type === 'video') {
        await uploadVideoDirect(file);
        setMessage('Video subido exitosamente. La transcripción se generará automáticamente.');
      } else {
        await uploadSmallFile(file, type);
        setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} subido exitosamente.`);
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error(`Error subiendo ${type}:`, error);
      setMessage(`Error al subir ${type}. Revisa la consola.`);
    } finally {
      setUploading(null);
      setProgress(null);
    }
  };

  const inputClass =
    'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100';

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Panel de Administrador</h3>
      <p className="text-sm text-gray-600 mb-4">Sube los archivos correspondientes a esta sesión.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Video */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video de la Sesión</label>
          <input
            type="file"
            accept="video/*,.mkv"
            onChange={(e) => handleUpload(e, 'video')}
            disabled={uploading !== null}
            className={inputClass}
          />
        </div>

        {/* Acta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Acta (PDF/DOCX)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleUpload(e, 'acta')}
            disabled={uploading !== null}
            className={inputClass}
          />
        </div>

        {/* Transcripción 
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transcripción</label>
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={(e) => handleUpload(e, 'transcription')}
            disabled={uploading !== null}
            className={inputClass}
          />
        </div>*/}

        {/* Miniatura (Thumbnail) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Miniatura (Imagen)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleUpload(e, 'thumbnail')}
            disabled={uploading !== null}
            className={inputClass}
          />
        </div>
      </div>

      {/* Mensajes de estado */}
      {uploading && (
        <div className="mt-4">
          <p className="text-blue-500 text-sm">
            Subiendo {uploading}
            {progress !== null ? `... ${progress}%` : '... por favor espera.'}
          </p>
          {progress !== null && (
            <div className="mt-2 h-2 w-full rounded bg-gray-200">
              <div
                className="h-2 rounded bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
      {message && (
        <p className={`text-sm mt-4 font-medium ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};