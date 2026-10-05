import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { LOCAL_STORAGE_KEYS } from '../../constants/localStorage/keys';

interface Props {
  sessionId: number;
}

export const AdminUploadSection = ({ sessionId }: Props) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  if (user?.role !== 'ADMIN') return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file); // 'file' debe coincidir con el FileInterceptor de NestJS

    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);

    try {
      await axios.post(`/api/sessions/${sessionId}/upload-${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} subido exitosamente.`);
    } catch (error) {
      console.error(`Error subiendo ${type}:`, error);
      setMessage(`Error al subir ${type}. Revisa la consola.`);
    } finally {
      setUploading(null);
    }
  };

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
            accept="video/*" 
            onChange={(e) => handleUpload(e, 'video')} 
            disabled={uploading !== null}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Transcripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transcripción</label>
          <input 
            type="file" 
            accept=".txt,.pdf,.doc,.docx" 
            onChange={(e) => handleUpload(e, 'transcription')} 
            disabled={uploading !== null}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Miniatura (Thumbnail) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Miniatura (Imagen)</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleUpload(e, 'thumbnail')} 
            disabled={uploading !== null}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      {/* Mensajes de estado */}
      {uploading && <p className="text-blue-500 text-sm mt-4">Subiendo {uploading}... por favor espera.</p>}
      {message && <p className={`text-sm mt-4 font-medium ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
    </div>
  );
};