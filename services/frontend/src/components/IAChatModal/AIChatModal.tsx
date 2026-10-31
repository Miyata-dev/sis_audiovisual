// AIChatModal.tsx
import { useState } from 'react';

interface Props {
  sessionId: number;
  sessionTitle: string;
  onClose: () => void;
}

export const AIChatModal = ({ sessionId, sessionTitle, onClose }: Props) => {
  const [pregunta, setPregunta] = useState('');
  const [historial, setHistorial] = useState<{ rol: 'user' | 'ia'; texto: string }[]>([]);
  const [cargando, setCargando] = useState(false);

  const enviarPregunta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pregunta.trim() || cargando) return;

    const nuevaPregunta = pregunta;
    setPregunta('');
    setHistorial((prev) => [...prev, { rol: 'user', texto: nuevaPregunta }]);
    setCargando(true);

    try {
      // Asumimos que tu backend tiene esta ruta y él se encarga de hablar con Ollama
      const response = await fetch(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: nuevaPregunta }),
      });

      if (!response.ok) throw new Error('Error al consultar a la IA');

      const data = await response.json();
      
      setHistorial((prev) => [...prev, { rol: 'ia', texto: data.respuesta }]);
    } catch (error) {
      console.error(error);
      setHistorial((prev) => [...prev, { rol: 'ia', texto: 'Lo siento, hubo un error de conexión con la IA.' }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[80vh]">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Consultar a la IA</h3>
            <p className="text-sm text-gray-500">{sessionTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 font-bold text-xl px-2">
            ✕
          </button>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
          {historial.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
              <p>Hazle una pregunta a la IA sobre esta sesión.</p>
              <p className="text-sm mt-2">Ej: "¿Se aprobó el presupuesto?" o "¿Qué dijo el consejero sobre la seguridad?"</p>
            </div>
          )}
          
          {historial.map((msg, index) => (
            <div key={index} className={`flex ${msg.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                msg.rol === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
              }`}>
                {msg.texto}
              </div>
            </div>
          ))}
          
          {cargando && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-lg text-sm text-gray-500 italic shadow-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                La IA está pensando...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={enviarPregunta} className="p-4 border-t bg-white rounded-b-lg flex gap-2">
          <input
            type="text"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Escribe tu pregunta aquí..."
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={cargando}
          />
          <button 
            type="submit" 
            disabled={cargando || !pregunta.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Enviar
          </button>
        </form>

      </div>
    </div>
  );
}