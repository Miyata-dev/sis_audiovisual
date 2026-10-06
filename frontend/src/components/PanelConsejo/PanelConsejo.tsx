import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type VotingEvent = {
  id: number;
  title: string;
  sessionId: number; 
};

export default function PanelConsejo() {
  const { user } = useAuth(); 
  
  // Estados de Asistencia y Palabra
  const [presente, setPresente] = useState(false);
  const [palabraSolicitada, setPalabraSolicitada] = useState(false);
  const [estadoPalabra, setEstadoPalabra] = useState<string | null>(null);
  
  // Estados de Votación
  const [votoSeleccionado, setVotoSeleccionado] = useState<string | null>(null);
  const [eventoActivo, setEventoActivo] = useState<VotingEvent | null>(null); 
  const [yaVoto, setYaVoto] = useState(false);
  const [votoRegistrado, setVotoRegistrado] = useState<string | null>(null);

  // Buscar la votación activa y el estado del usuario mediante Polling
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/votes/active');
        if (response.ok) {
          const data = await response.json();
          if (data && data.id) {
            setEventoActivo(data);
            
            if (user?.id) {
              // Verificamos si ya votó
              const checkRes = await fetch(`http://localhost:3000/api/votes/check?userId=${user.id}&votingEventId=${data.id}`);
              if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.hasVoted) {
                  setYaVoto(true);
                  setVotoRegistrado(checkData.option);
                }
              }

              // Verificamos asistencia y estado de la palabra
              const currentSessionId = data.sessionId || 3;
              const statusRes = await fetch(`http://localhost:3000/api/votes/user-status?userId=${user.id}&sessionId=${currentSessionId}`);
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                setPresente(statusData.presente);
                setPalabraSolicitada(statusData.palabraSolicitada);
                setEstadoPalabra(statusData.estadoPalabra);
              }
            }
          }
        } else {
            // Si no hay evento activo, limpiamos el estado del evento
            setEventoActivo(null);
            setYaVoto(false);
            setVotoRegistrado(null);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    cargarDatos(); // Primera carga inmediata
    const intervalo = setInterval(cargarDatos, 3000); // Se actualiza cada 3 segundos
    return () => clearInterval(intervalo);
  }, [user]);

  // Enviar Asistencia a la BD
  const marcarAsistencia = async () => {
    if (!user) return alert('No hay sesión de usuario activa');
    const currentSessionId = eventoActivo?.sessionId || 3; 
    
    try {
      const res = await fetch('http://localhost:3000/api/votes/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: currentSessionId }),
      });
      if (res.ok) {
        setPresente(true);
      }
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
    }
  };

  // Enviar Solicitud de Palabra a la BD
  const pedirPalabra = async () => {
    if (!user) return alert('No hay sesión de usuario activa');
    const currentSessionId = eventoActivo?.sessionId || 3;

    try {
      const res = await fetch('http://localhost:3000/api/votes/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: currentSessionId }),
      });
      if (res.ok) {
        setPalabraSolicitada(true);
        setEstadoPalabra('PENDIENTE');
      }
    } catch (error) {
      console.error('Error al solicitar palabra:', error);
    }
  };

  // Cancelar Solicitud o Terminar Intervención
  const cancelarPalabra = async () => {
    if (!user) return alert('No hay sesión de usuario activa');
    const currentSessionId = eventoActivo?.sessionId || 3;

    try {
      const res = await fetch('http://localhost:3000/api/votes/speak/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: currentSessionId }),
      });
      if (res.ok) {
        setPalabraSolicitada(false);
        setEstadoPalabra(null);
      }
    } catch (error) {
      console.error('Error al cancelar palabra:', error);
    }
  };

  const enviarVoto = async () => {
    if (!votoSeleccionado || !user || !eventoActivo) return;

    try {
      const response = await fetch('http://localhost:3000/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, 
          votingEventId: eventoActivo.id,
          option: votoSeleccionado,
        }),
      });

      if (response.ok) {
        setYaVoto(true);
        setVotoRegistrado(votoSeleccionado);
      } else {
        const errorData = await response.json();
        alert(`Error al votar: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error de red:', error);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6 bg-gray-50/50">
      
      {/* CABECERA DE SESIÓN EN CURSO */}
      <div className="bg-[#eef7f0] border border-[#d2ebd7] rounded-md p-6 flex flex-col md:flex-row gap-6 relative">
        <div className="absolute bottom-4 left-6 bg-[#4CAF50] text-white text-sm font-semibold px-3 py-1 rounded">Sesion en curso</div>
        <div className="relative w-full md:w-64 h-36 bg-gray-800 rounded overflow-hidden flex-shrink-0 mb-4 md:mb-0">
          <img src="https://placehold.co/600x400/2d3748/ffffff?text=Video+En+Vivo" alt="Sesión en vivo" className="w-full h-full object-cover opacity-70"/>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center bg-black/40">
               <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
             </div>
          </div>
        </div>
        <div className="flex flex-col flex-grow">
          <h2 className="text-2xl font-semibold text-gray-800">Sesión Ordinaria N°10</h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            28 de agosto de 2026 - 10:00 hrs
          </p>
          <p className="text-gray-700 mt-2 font-medium">Tema: Presupuesto regional 2026</p>
          <div className="flex gap-3 mt-auto pt-4">
            <span className="flex items-center gap-1 bg-[#4CAF50] text-white text-xs font-medium px-2.5 py-1 rounded">Video</span>
            <span className="flex items-center gap-1 border border-gray-400 text-gray-600 bg-white text-xs font-medium px-2.5 py-1 rounded">Transcripción</span>
            <span className="flex items-center gap-1 border border-gray-400 text-gray-600 bg-white text-xs font-medium px-2.5 py-1 rounded">Votaciones</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Asistencia y Palabra */}
        <div className="space-y-6">
          
          {/* Módulo de Asistencia */}
          <div className="bg-[#f8f9fa] border border-gray-300 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <h3 className="font-semibold text-lg">Mi asistencia</h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${presente ? 'bg-[#4CAF50]' : 'bg-gray-400'}`}>
                  ✓
                </div>
                <div>
                  <p className={`text-sm font-medium ${presente ? 'text-[#4CAF50]' : 'text-gray-500'}`}>
                    {presente ? 'Estás marcado como presente' : 'Estás marcado como ausente'}
                  </p>
                  {!presente && !eventoActivo && (
                    <p className="text-xs text-gray-400 mt-0.5">La asistencia se abrirá junto con el tema</p>
                  )}
                </div>
              </div>
              <button 
                onClick={marcarAsistencia}
                disabled={presente || !eventoActivo} 
                className={`px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                  presente 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : !eventoActivo 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                      : 'bg-[#e8f5e9] text-gray-800 border border-[#a5d6a7] hover:bg-[#c8e6c9]' 
                }`}
              >
                {presente ? 'Asistencia enviada' : 'Marcar presente'}
              </button>
            </div>
          </div>

          {/* Módulo Solicitud de Palabra */}
          <div className="bg-[#f8f9fa] border border-gray-300 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-2 text-gray-700">
              <h3 className="font-semibold text-lg">Solicitud de palabra</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              {eventoActivo 
                ? 'Solicita el turno de palabra cuando lo necesites. Aparecerás en la cola del moderador.' 
                : 'La solicitud de palabra está deshabilitada hasta que el Presidente inicie un nuevo tema.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              
              {/* BOTÓN DINÁMICO */}
              <button 
                onClick={palabraSolicitada ? cancelarPalabra : pedirPalabra}
                disabled={!eventoActivo}
                className={`px-4 py-2.5 rounded text-sm font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center text-white shadow-sm ${
                  !eventoActivo ? 'bg-gray-400 cursor-not-allowed opacity-70' :
                  estadoPalabra === 'HABLANDO' ? 'bg-orange-500 hover:bg-orange-600' : 
                  palabraSolicitada ? 'bg-red-500 hover:bg-red-600' : 'bg-[#4CAF50] hover:bg-[#43a047]'
                }`}
              >
                {estadoPalabra === 'HABLANDO' ? 'Terminar mi intervención' : 
                (palabraSolicitada ? 'Cancelar solicitud' : 'Solicitar palabra')}
              </button>
              
              {eventoActivo && (
                <div className="bg-[#e8f5e9] text-[#2e7d32] text-xs p-3 rounded flex-grow flex items-start gap-2 border border-[#c8e6c9]">
                  <span className="bg-[#2e7d32] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0 mt-0.5">!</span>
                  <p>Tu solicitud será visible para el presidente de la sesión y los demas consejeros</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Sistema de Votación */}
        <div className="bg-[#f8f9fa] border border-gray-300 rounded-sm p-6 flex flex-col h-full">
          <div className="bg-[#d5d5d5] p-4 rounded-sm mb-auto">
            <h3 className="text-lg font-semibold text-gray-800">
              {eventoActivo ? eventoActivo.title : 'Esperando a que inicie una votación...'}
            </h3>
          </div>
          
          {!eventoActivo ? (
            <div className="flex flex-col items-center justify-center h-full mt-8 opacity-50">
                <div className="mt-8 mb-6 grid grid-cols-3 gap-3 w-full">
                    <button disabled className="py-3 rounded font-medium bg-[#81c784] text-white cursor-not-allowed">A favor</button>
                    <button disabled className="py-3 rounded font-medium bg-[#e53935] text-white cursor-not-allowed">En contra</button>
                    <button disabled className="py-3 rounded font-medium bg-[#90a4ae] text-white cursor-not-allowed">Abstención</button>
                </div>
                <button disabled className="w-full py-3.5 rounded font-bold text-white bg-[#1b5e20] cursor-not-allowed">Emitir voto</button>
            </div>
          ) : yaVoto ? (
            <div className="flex flex-col items-center justify-center mt-8 mb-6 bg-[#e8f5e9] border border-[#a5d6a7] p-6 rounded text-center h-full">
              <h4 className="text-lg font-bold text-gray-800">Voto emitido</h4>
              <p className="text-sm text-gray-600 mt-1">
                Has registrado tu voto: <span className="font-bold uppercase">{votoRegistrado}</span>
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8 mb-6 grid grid-cols-3 gap-3">
                <button onClick={() => setVotoSeleccionado('favor')} className={`py-3 rounded font-medium transition-all ${votoSeleccionado === 'favor' ? 'bg-[#7bc57e] text-white shadow-inner' : 'bg-[#81c784] text-white hover:bg-[#7bc57e]'}`}>A favor</button>
                <button onClick={() => setVotoSeleccionado('contra')} className={`py-3 rounded font-medium transition-all ${votoSeleccionado === 'contra' ? 'bg-[#d32f2f] text-white shadow-inner' : 'bg-[#e53935] text-white hover:bg-[#d32f2f]'}`}>En contra</button>
                <button onClick={() => setVotoSeleccionado('abstencion')} className={`py-3 rounded font-medium transition-all ${votoSeleccionado === 'abstencion' ? 'bg-[#78909c] text-white shadow-inner' : 'bg-[#90a4ae] text-white hover:bg-[#78909c]'}`}>Abstención</button>
              </div>

              <button onClick={enviarVoto} disabled={!votoSeleccionado} className={`w-full py-3.5 rounded font-bold text-white transition-colors ${votoSeleccionado ? 'bg-[#1b5e20] hover:bg-[#144d18]' : 'bg-[#1b5e20] opacity-50 cursor-not-allowed'}`}>Emitir voto</button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}