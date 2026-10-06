import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type VotingEvent = { id: number; title: string; sessionId: number; };
type TemaHistorial = { id: number; title: string; resultados: Record<string, number>; totalVotos: number; };
type Sesion = { id: number; title: string; status?: string; theme?: string };

export default function PanelConsejo() {
  const { user } = useAuth(); 
  
  // Estado para Sesiones Dinámicas
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [sesionSeleccionada, setSesionSeleccionada] = useState<number | string>('');

  const [presente, setPresente] = useState(false);
  const [palabraSolicitada, setPalabraSolicitada] = useState(false);
  const [estadoPalabra, setEstadoPalabra] = useState<string | null>(null);
  
  // Votación e Historial
  const [votoSeleccionado, setVotoSeleccionado] = useState<string | null>(null);
  const [eventoActivo, setEventoActivo] = useState<VotingEvent | null>(null); 
  const [historial, setHistorial] = useState<TemaHistorial[]>([]);
  const [yaVoto, setYaVoto] = useState(false);
  const [votoRegistrado, setVotoRegistrado] = useState<string | null>(null);

  // 1. Cargar lista de sesiones al iniciar
  useEffect(() => {
    const fetchSesiones = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/votes/sessions');
        if (res.ok) {
          const data = await res.json();
          setSesiones(data);
          if (data.length > 0) setSesionSeleccionada(data[0].id);
        }
      } catch (error) { console.error('Error cargando sesiones:', error); }
    };
    fetchSesiones();
  }, []);

  // 2. Polling de datos dependiendo de la sesión seleccionada (Usamos el dashboard)
  useEffect(() => {
    if (!sesionSeleccionada) return;

    const cargarDatos = async () => {
      try {
        // Consumimos el dashboard para obtener el evento activo Y el historial
        const response = await fetch(`http://localhost:3000/api/votes/dashboard/live?sessionId=${sesionSeleccionada}`);
        if (response.ok) {
          const data = await response.json();
          
          setHistorial(data.historial || []); // Guardamos el historial

          // Validamos si hay un evento activo en esta sesión
          if (data.evento && data.evento.id) {
            setEventoActivo(data.evento);
            if (user?.id) {
              const checkRes = await fetch(`http://localhost:3000/api/votes/check?userId=${user.id}&votingEventId=${data.evento.id}`);
              if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.hasVoted) {
                  setYaVoto(true);
                  setVotoRegistrado(checkData.option);
                } else {
                  setYaVoto(false);
                  setVotoRegistrado(null);
                }
              }
            }
          } else {
            setEventoActivo(null);
            setYaVoto(false);
            setVotoRegistrado(null);
          }
        }

        // Consultar estado personal de asistencia y palabra
        if (user?.id) {
          const statusRes = await fetch(`http://localhost:3000/api/votes/user-status?userId=${user.id}&sessionId=${sesionSeleccionada}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setPresente(statusData.presente);
            setPalabraSolicitada(statusData.palabraSolicitada);
            setEstadoPalabra(statusData.estadoPalabra);
          }
        }
      } catch (error) { console.error('Error al cargar datos:', error); }
    };

    cargarDatos(); 
    const intervalo = setInterval(cargarDatos, 3000); 
    return () => clearInterval(intervalo);
  }, [user, sesionSeleccionada]); 

  const marcarAsistencia = async () => {
    if (!user || !sesionSeleccionada) return;
    try {
      const res = await fetch('http://localhost:3000/api/votes/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: Number(sesionSeleccionada) }),
      });
      if (res.ok) setPresente(true);
    } catch (error) { console.error('Error asistencia:', error); }
  };

  const pedirPalabra = async () => {
    if (!user || !sesionSeleccionada) return;
    try {
      const res = await fetch('http://localhost:3000/api/votes/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: Number(sesionSeleccionada) }),
      });
      if (res.ok) {
        setPalabraSolicitada(true);
        setEstadoPalabra('PENDIENTE');
      }
    } catch (error) { console.error('Error pedir palabra:', error); }
  };

  const cancelarPalabra = async () => {
    if (!user || !sesionSeleccionada) return;
    try {
      const res = await fetch('http://localhost:3000/api/votes/speak/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: Number(sesionSeleccionada) }),
      });
      if (res.ok) {
        setPalabraSolicitada(false);
        setEstadoPalabra(null);
      }
    } catch (error) { console.error('Error cancelar palabra:', error); }
  };

  const enviarVoto = async () => {
    if (!votoSeleccionado || !user || !eventoActivo) return;
    try {
      const response = await fetch('http://localhost:3000/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, votingEventId: eventoActivo.id, option: votoSeleccionado }),
      });
      if (response.ok) {
        setYaVoto(true);
        setVotoRegistrado(votoSeleccionado);
      } else {
        const errorData = await response.json();
        alert(`Error al votar: ${errorData.message}`);
      }
    } catch (error) { console.error('Error de red:', error); }
  };

  const sesionActual = sesiones.find(s => s.id === Number(sesionSeleccionada));
  const estaFinalizada = sesionActual?.status === 'FINALIZADA';

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6 bg-gray-50/50">
      
      <div className="bg-[#eef7f0] border border-[#d2ebd7] rounded-md p-6 flex flex-col md:flex-row gap-6 relative">
        <div className="absolute bottom-4 left-6 bg-[#4CAF50] text-white text-sm font-semibold px-3 py-1 rounded shadow-sm z-10">Sesión en curso</div>
        <div className="relative w-full md:w-64 h-36 bg-gray-800 rounded overflow-hidden flex-shrink-0 mb-4 md:mb-0 shadow-sm">
          <img src="https://placehold.co/600x400/2d3748/ffffff?text=Video+En+Vivo" alt="Sesión en vivo" className="w-full h-full object-cover opacity-70"/>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center bg-black/40 cursor-pointer hover:bg-black/60 transition-colors">
               <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
             </div>
          </div>
        </div>
        <div className="flex flex-col flex-grow">
          <select 
            value={sesionSeleccionada}
            onChange={(e) => setSesionSeleccionada(e.target.value)}
            className="text-2xl font-semibold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-[#4CAF50] focus:outline-none pb-1 w-fit cursor-pointer transition-colors appearance-none pr-6"
          >
            {sesiones.map(sesion => (
              <option key={sesion.id} value={sesion.id}>{sesion.title}</option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2 capitalize">
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {/* MOSTRAMOS EL TEMA GENERAL DE LA SESIÓN */}
          {sesionActual?.theme && (
            <p className="text-gray-700 mt-1 text-sm font-medium">Tema General: <span className="font-normal">{sesionActual.theme}</span></p>
          )}

          <p className="text-gray-700 mt-2 font-medium">
            Votación actual: {eventoActivo ? <span className="text-[#1b5e20]">{eventoActivo.title}</span> : <span className="text-gray-400 italic">Ninguna activa...</span>}
          </p>

          <div className="flex gap-3 mt-auto pt-4">
            <span className="flex items-center gap-1 bg-[#4CAF50] text-white text-xs font-medium px-2.5 py-1 rounded shadow-sm">Video</span>
            <span className="flex items-center gap-1 border border-gray-400 text-gray-600 bg-white text-xs font-medium px-2.5 py-1 rounded shadow-sm hover:bg-gray-50 cursor-pointer">Transcripción</span>
            <span className="flex items-center gap-1 border border-gray-400 text-gray-600 bg-white text-xs font-medium px-2.5 py-1 rounded shadow-sm hover:bg-gray-50 cursor-pointer">Votaciones</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-[#f8f9fa] border border-gray-300 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-4 text-gray-700"><h3 className="font-semibold text-lg">Mi asistencia</h3></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${presente ? 'bg-[#4CAF50]' : 'bg-gray-400'}`}>✓</div>
                <div>
                  <p className={`text-sm font-medium ${presente ? 'text-[#4CAF50]' : 'text-gray-500'}`}>{presente ? 'Estás marcado como presente' : 'Estás marcado como ausente'}</p>
                  {!presente && !eventoActivo && <p className="text-xs text-gray-400 mt-0.5">La asistencia se abrirá junto con el tema</p>}
                </div>
              </div>
              <button onClick={marcarAsistencia} disabled={presente || !eventoActivo} className={`px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${presente ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : !eventoActivo ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300' : 'bg-[#e8f5e9] text-gray-800 border border-[#a5d6a7] hover:bg-[#c8e6c9]' }`}>
                {presente ? 'Asistencia enviada' : 'Marcar presente'}
              </button>
            </div>
          </div>

          <div className="bg-[#f8f9fa] border border-gray-300 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-2 text-gray-700"><h3 className="font-semibold text-lg">Solicitud de palabra</h3></div>
            <p className="text-sm text-gray-500 mb-6">{eventoActivo ? 'Solicita el turno de palabra cuando lo necesites. Aparecerás en la cola del moderador.' : 'La solicitud de palabra está deshabilitada hasta que el Presidente inicie un nuevo tema.'}</p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button onClick={palabraSolicitada ? cancelarPalabra : pedirPalabra} disabled={!eventoActivo} className={`px-4 py-2.5 rounded text-sm font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center text-white shadow-sm ${!eventoActivo ? 'bg-gray-400 cursor-not-allowed opacity-70' : estadoPalabra === 'HABLANDO' ? 'bg-orange-500 hover:bg-orange-600' : palabraSolicitada ? 'bg-red-500 hover:bg-red-600' : 'bg-[#4CAF50] hover:bg-[#43a047]'}`}>
                {estadoPalabra === 'HABLANDO' ? 'Terminar mi intervención' : (palabraSolicitada ? 'Cancelar solicitud' : 'Solicitar palabra')}
              </button>
              {eventoActivo && (
                <div className="bg-[#e8f5e9] text-[#2e7d32] text-xs p-3 rounded flex-grow flex items-start gap-2 border border-[#c8e6c9]">
                  <span className="bg-[#2e7d32] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0 mt-0.5">!</span>
                  <p>Visible para el moderador</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: VOTACIÓN O HISTORIAL */}
        <div className="bg-[#f8f9fa] border border-gray-300 rounded-sm p-6 flex flex-col h-full">
          {eventoActivo ? (
            // INTERFAZ DE VOTACIÓN ACTIVA
            <>
              <div className="bg-[#d5d5d5] p-4 rounded-sm mb-auto">
                <h3 className="text-lg font-semibold text-gray-800">Votación en curso: {eventoActivo.title}</h3>
              </div>
              
              {yaVoto ? (
                <div className="flex flex-col items-center justify-center mt-8 mb-6 bg-[#e8f5e9] border border-[#a5d6a7] p-6 rounded text-center h-full">
                  <h4 className="text-lg font-bold text-gray-800">Voto emitido</h4>
                  <p className="text-sm text-gray-600 mt-1">Has registrado tu voto: <span className="font-bold uppercase">{votoRegistrado}</span></p>
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
            </>
          ) : (
            // INTERFAZ DE HISTORIAL (CUANDO NO HAY VOTACIÓN ACTIVA)
            <>
              <div className="bg-gray-200 p-4 rounded-sm mb-6 text-center">
                <h3 className="text-gray-600 font-medium">
                  {estaFinalizada ? 'Sesión finalizada. Revisa el historial de votos.' : 'Esperando a que el Presidente inicie una votación...'}
                </h3>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Temas Finalizados</h3>
                <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded">En esta sesión</span>
              </div>
              
              <div className="flex-grow overflow-y-auto pr-2 max-h-[350px]">
                {!historial || historial.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10">
                    <p>Aún no hay temas votados en esta sesión.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {historial.map((tema) => (
                      <li key={tema.id} className="p-4 border border-gray-200 rounded bg-white shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-1">{tema.title}</h4>
                        <p className="text-xs text-gray-500 mb-3">{tema.totalVotos} votos emitidos</p>
                        <div className="flex gap-2 text-[11px] font-bold">
                          <span className="text-green-800 bg-green-100 px-2.5 py-1 rounded">A Favor: {tema.resultados['favor'] || 0}</span>
                          <span className="text-red-800 bg-red-100 px-2.5 py-1 rounded">Contra: {tema.resultados['contra'] || 0}</span>
                          <span className="text-gray-700 bg-gray-200 px-2.5 py-1 rounded">Abst.: {tema.resultados['abstencion'] || 0}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}