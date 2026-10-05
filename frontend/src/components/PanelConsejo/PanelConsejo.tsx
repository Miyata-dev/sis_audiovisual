import React, { useState } from 'react';

export default function PanelConsejo() {
  const [presente, setPresente] = useState(true);
  const [votoSeleccionado, setVotoSeleccionado] = useState<string | null>(null);

  const enviarVoto = async () => {
    if (!votoSeleccionado) return;

    try {
      const response = await fetch('http://localhost:3000/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // ID temporal 
          votingEventId: 1, 
          option: votoSeleccionado,
        }),
      });

      if (response.ok) {
        alert(`Tu voto "${votoSeleccionado}" ha sido registrado correctamente.`);
      } else {
        const errorData = await response.json();
        alert(`Error al votar: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error de red:', error);
      alert('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6 bg-gray-50/50">
      
      {/* CABECERA DE SESIÓN EN CURSO */}
      <div className="bg-[#eef7f0] border border-[#d2ebd7] rounded-md p-6 flex flex-col md:flex-row gap-6 relative">
        <div className="absolute bottom-4 left-6 bg-[#4CAF50] text-white text-sm font-semibold px-3 py-1 rounded">
          Sesion en curso
        </div>
        
        {/* Miniatura */}
        <div className="relative w-full md:w-64 h-36 bg-gray-800 rounded overflow-hidden flex-shrink-0 mb-4 md:mb-0">
          <img 
            src="https://placehold.co/600x400/2d3748/ffffff?text=Video+En+Vivo" 
            alt="Sesión en vivo" 
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center bg-black/40">
               <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
             </div>
          </div>
        </div>

        {/* Info de la sesión */}
        <div className="flex flex-col flex-grow">
          <h2 className="text-2xl font-semibold text-gray-800">Sesión Ordinaria N°10</h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            28 de agosto de 2026 - 10:00 hrs
          </p>
          <p className="text-gray-700 mt-2 font-medium">Tema: Presupuesto regional 2026</p>
          
          {/* Badges */}
          <div className="flex gap-3 mt-auto pt-4">
            <span className="flex items-center gap-1 bg-[#4CAF50] text-white text-xs font-medium px-2.5 py-1 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>
              Video
            </span>
            <span className="flex items-center gap-1 border border-gray-400 text-gray-600 bg-white text-xs font-medium px-2.5 py-1 rounded">
            Transcripción
            </span>
            <span className="flex items-center gap-1 border border-gray-400 text-gray-600 bg-white text-xs font-medium px-2.5 py-1 rounded">
              Votaciones
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Asistencia y Palabra */}
        <div className="space-y-6">
          
          {/* Módulo de Asistencia */}
          <div className="bg-[#f8f9fa] border border-gray-300 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              <h3 className="font-semibold text-lg">Mi asistencia</h3>
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${presente ? 'bg-[#4CAF50]' : 'bg-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div>
                  <p className={`text-sm font-medium ${presente ? 'text-[#4CAF50]' : 'text-gray-500'}`}>
                    {presente ? 'Estás marcado como presente' : 'Estás marcado como ausente'}
                  </p>
                  <p className="text-xs text-blue-300 font-medium">Hora de ingreso: 09:40 hrs</p>
                </div>
              </div>
              <button 
                onClick={() => setPresente(!presente)}
                className="bg-[#e8f5e9] text-gray-800 border border-[#a5d6a7] px-4 py-2 rounded text-sm font-medium hover:bg-[#c8e6c9] transition-colors"
              >
                Cambiar de estado
              </button>
            </div>
          </div>

          {/* Módulo Solicitud de Palabra */}
          <div className="bg-[#f8f9fa] border border-gray-300 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-2 text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              <h3 className="font-semibold text-lg">Solicitud de palabra</h3>
            </div>
            <p className="text-sm text-blue-300 mb-6">
              Solicitar el turno de palabra cuando lo necesites. Tu solicitud aparecerá en la cola del moderador
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button className="bg-[#4CAF50] hover:bg-[#43a047] text-white px-4 py-2.5 rounded text-sm font-medium flex items-center gap-2 transition-colors w-full sm:w-auto justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path></svg>
                Solicitar palabra
              </button>
              <div className="bg-[#e8f5e9] text-[#2e7d32] text-xs p-3 rounded flex-grow flex items-start gap-2 border border-[#c8e6c9]">
                <span className="bg-[#2e7d32] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0 mt-0.5">!</span>
                <p>Tu solicitud será visible para el presidente de la sesión y los demas consejeros</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Sistema de Votación */}
        <div className="bg-[#f8f9fa] border border-gray-300 rounded-sm p-6 flex flex-col h-full">
          <div className="bg-[#d5d5d5] p-4 rounded-sm mb-auto">
            <h3 className="text-lg font-semibold text-gray-800">Presupuesto 2026</h3>
          </div>
          
          <div className="mt-8 mb-6 grid grid-cols-3 gap-3">
            <button 
              onClick={() => setVotoSeleccionado('favor')}
              className={`py-3 rounded font-medium transition-all ${votoSeleccionado === 'favor' ? 'bg-[#7bc57e] text-white shadow-inner' : 'bg-[#81c784] text-white hover:bg-[#7bc57e]'}`}
            >
              A favor
            </button>
            <button 
              onClick={() => setVotoSeleccionado('contra')}
              className={`py-3 rounded font-medium transition-all ${votoSeleccionado === 'contra' ? 'bg-[#d32f2f] text-white shadow-inner' : 'bg-[#e53935] text-white hover:bg-[#d32f2f]'}`}
            >
              En contra
            </button>
            <button 
              onClick={() => setVotoSeleccionado('abstencion')}
              className={`py-3 rounded font-medium transition-all ${votoSeleccionado === 'abstencion' ? 'bg-[#78909c] text-white shadow-inner' : 'bg-[#90a4ae] text-white hover:bg-[#78909c]'}`}
            >
              Abstención
            </button>
          </div>

          <button 
            onClick={enviarVoto}
            disabled={!votoSeleccionado}
            className={`w-full py-3.5 rounded font-bold text-white transition-colors ${votoSeleccionado ? 'bg-[#1b5e20] hover:bg-[#144d18]' : 'bg-[#1b5e20] opacity-50 cursor-not-allowed'}`}
          >
            Emitir voto
          </button>
        </div>

      </div>
    </div>
  );
}