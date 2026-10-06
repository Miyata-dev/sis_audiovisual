import React, { useState, useEffect, useCallback } from 'react';

type Solicitud = { id: number; nombre: string; hora: string; status: string; };
type TemaHistorial = { id: number; title: string; resultados: Record<string, number>; totalVotos: number; };
type Sesion = { id: number; title: string; status?: string };

type DashboardData = {
  evento: { id: number; title: string; status: string; sessionId: number } | null;
  resultados: Record<string, number>;
  asistentes: string[];
  solicitudes: Solicitud[];
  historial?: TemaHistorial[]; 
};

export default function PanelPresidente() {
  const [data, setData] = useState<DashboardData>({ evento: null, resultados: {}, asistentes: [], solicitudes: [], historial: [] });
  
  // Estados para Sesiones y Temas
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [sesionSeleccionada, setSesionSeleccionada] = useState<number | string>('');
  const [nuevoTema, setNuevoTema] = useState(''); 
  
  // ESTADOS PARA EL MODAL DE CREAR SESIÓN
  const [mostrarModalSesion, setMostrarModalSesion] = useState(false);
  const [nuevaSesionTitulo, setNuevaSesionTitulo] = useState('');
  const [nuevaSesionTema, setNuevaSesionTema] = useState('');

  const cargarSesiones = useCallback(async () => {
    try {
      const res = await fetch('/api/votes/sessions');
      if (res.ok) {
        const dataSesiones = await res.json();
        setSesiones(dataSesiones);
        setSesionSeleccionada((prev) => (prev === '' && dataSesiones.length > 0 ? dataSesiones[0].id : prev));
      }
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
    }
  }, []);

  const cargarDashboard = useCallback(async () => {
    if (!sesionSeleccionada || sesionSeleccionada === 'nueva') return;
    try {
      const response = await fetch(`/api/votes/dashboard/live?sessionId=${sesionSeleccionada}`);
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      }
    } catch (error) {
      console.error('Error al cargar dashboard en vivo:', error);
    }
  }, [sesionSeleccionada]); 

  useEffect(() => {
    const initSesiones = async () => { await cargarSesiones(); };
    initSesiones();
  }, [cargarSesiones]);

  useEffect(() => {
    const initDashboard = async () => { await cargarDashboard(); };
    initDashboard();
    const intervalo = setInterval(cargarDashboard, 3000);
    return () => clearInterval(intervalo);
  }, [cargarDashboard]);

  const manejarCambioSesion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'nueva') {
      setMostrarModalSesion(true); 
      setSesionSeleccionada(sesiones.length > 0 ? sesiones[0].id : ''); 
    } else {
      setSesionSeleccionada(Number(value));
    }
  };

  const confirmarCrearSesion = async () => {
    if (!nuevaSesionTitulo.trim() || !nuevaSesionTema.trim()) return;
    try {
      const res = await fetch('/api/votes/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nuevaSesionTitulo, theme: nuevaSesionTema }) 
      });
      if (res.ok) {
        const nuevaSesion = await res.json();
        await cargarSesiones(); 
        setSesionSeleccionada(nuevaSesion.id); 
        setMostrarModalSesion(false); 
        setNuevaSesionTitulo(''); 
        setNuevaSesionTema(''); 
      } else {
        alert('Hubo un error al crear la sesión en el servidor.');
      }
    } catch (err) {
      console.error("Error al crear sesión:", err);
    }
  };

  const iniciarNuevaVotacion = async () => {
    if (!nuevoTema.trim() || !sesionSeleccionada) return;
    try {
      const response = await fetch('/api/votes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nuevoTema, sessionId: Number(sesionSeleccionada) }),
      });
      if (response.ok) {
        setNuevoTema('');
        cargarDashboard();
      } else {
        const err = await response.json();
        alert(err.message || 'Error al crear la votación');
      }
    } catch (error) {
      console.error('Error al iniciar votación:', error);
    }
  };

  const cerrarVotacion = async () => {
    if (!data.evento) return;
    if (!window.confirm('¿Estás seguro de que deseas cerrar la votación de este TEMA?')) return;
    try {
      const response = await fetch('/api/votes/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votingEventId: data.evento.id }),
      });
      if (response.ok) cargarDashboard(); 
    } catch (error) { console.error('Error al cerrar votación:', error); }
  };

  const finalizarSesionCompleta = async () => {
    if (!window.confirm('¿Estás seguro de finalizar TODA LA SESIÓN? Ya no podrás crear más temas.')) return;
    try {
      const response = await fetch('/api/votes/sessions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: Number(sesionSeleccionada) }),
      });
      if (response.ok) {
        await cargarSesiones(); 
      }
    } catch (error) {
      console.error('Error al finalizar sesión:', error);
    }
  };

  const darPalabra = async (id: number) => {
    await fetch('/api/votes/speak/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ solicitudId: id }) });
    cargarDashboard();
  };

  const quitarPalabra = async (id: number) => {
    await fetch('/api/votes/speak/end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ solicitudId: id }) });
    cargarDashboard();
  };

  const votosFavor = data.resultados['favor'] || 0;
  const votosContra = data.resultados['contra'] || 0;
  const votosAbstencion = data.resultados['abstencion'] || 0;
  const totalVotos = votosFavor + votosContra + votosAbstencion;

  const sesionActual = sesiones.find(s => s.id === Number(sesionSeleccionada));
  const estaFinalizada = sesionActual?.status === 'FINALIZADA';

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-gray-50/50 min-h-screen relative">
      
      {/* MODAL FLOTANTE PARA CREAR NUEVA SESIÓN  */}
      {mostrarModalSesion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200 animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Crear Nueva Sesión</h3>
            <p className="text-sm text-gray-500 mb-6">
              Ingresa los detalles de la sesión. Se establecerá como "Abierta" automáticamente.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Título de la sesión</label>
                <input 
                  type="text" 
                  value={nuevaSesionTitulo}
                  onChange={(e) => setNuevaSesionTitulo(e.target.value)}
                  placeholder="Ej: Sesión Ordinaria N°11" 
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tema General</label>
                <input 
                  type="text" 
                  value={nuevaSesionTema}
                  onChange={(e) => setNuevaSesionTema(e.target.value)}
                  placeholder="Ej: Discusión de Presupuestos 2027" 
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setMostrarModalSesion(false); setNuevaSesionTitulo(''); setNuevaSesionTema(''); }} 
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarCrearSesion}
                disabled={!nuevaSesionTitulo.trim() || !nuevaSesionTema.trim()}
                className="px-5 py-2.5 bg-[#1b5e20] hover:bg-[#144d18] text-white font-bold rounded transition-colors disabled:opacity-50"
              >
                Crear Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div className="bg-[#1b5e20] rounded-md p-6 flex flex-col md:flex-row items-start md:items-center justify-between shadow-md text-white">
        <div>
          <span className="bg-red-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">Vista Moderador (En Vivo)</span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-bold">Panel de Control:</h1>
            <select 
              value={sesionSeleccionada}
              onChange={manejarCambioSesion}
              className="bg-[#144d18] border border-[#4CAF50] text-lg md:text-xl font-semibold text-white rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-[#a5d6a7] cursor-pointer shadow-sm appearance-none pr-8 relative"
            >
              {sesiones.map(sesion => (
                <option key={sesion.id} value={sesion.id}>{sesion.title}</option>
              ))}
              <option value="nueva" className="bg-green-800 font-bold">+ Crear nueva sesión...</option>
            </select>
          </div>
          
          <div className="text-[#a5d6a7] mt-2 text-sm flex items-center gap-2">
            Estado: 
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${estaFinalizada ? 'bg-red-600 text-white' : 'bg-green-500 text-white'}`}>
              {sesionActual ? sesionActual.status : 'Cargando...'}
            </span> 
            | Gobernador Regional del Biobío
            
            {sesionActual && !estaFinalizada && (
              <button 
                onClick={finalizarSesionCompleta}
                className="ml-4 bg-red-600 hover:bg-red-700 text-xs px-3 py-1 rounded text-white font-bold transition-colors"
              >
                Finalizar Sesión
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-left md:text-right w-full md:w-auto border-t border-[#2e7d32] md:border-t-0 pt-4 md:pt-0">
          <p className="text-xl font-bold">Asistencia: {data.asistentes.length} <span className="text-sm font-normal text-[#a5d6a7]">/ 29 Consejeros</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {data.evento ? (
            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Votación Activa: {data.evento.title}</h3>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">{totalVotos} Votos Emitidos</span>
                  <button onClick={cerrarVotacion} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1.5 px-4 rounded transition-colors shadow-sm">Cerrar Votación</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[#e8f5e9] border border-[#a5d6a7] rounded-lg p-4 text-center"><p className="text-gray-600 font-semibold mb-1">A Favor</p><p className="text-4xl font-bold text-[#2e7d32]">{votosFavor}</p></div>
                <div className="bg-[#ffebee] border border-[#ef9a9a] rounded-lg p-4 text-center"><p className="text-gray-600 font-semibold mb-1">En Contra</p><p className="text-4xl font-bold text-[#c62828]">{votosContra}</p></div>
                <div className="bg-[#eceff1] border border-[#b0bec5] rounded-lg p-4 text-center"><p className="text-gray-600 font-semibold mb-1">Abstención</p><p className="text-4xl font-bold text-[#455a64]">{votosAbstencion}</p></div>
              </div>
            </div>
          ) : estaFinalizada ? (
            <div className="bg-gray-100 border border-gray-200 rounded-md p-10 shadow-sm flex flex-col items-center justify-center h-full min-h-[350px]">
              <div className="bg-gray-300 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">Sesión Finalizada</h3>
              <p className="text-gray-500 mb-8 text-center max-w-md">Esta sesión ya fue concluida. No es posible abrir nuevos temas de discusión ni votaciones. Consulta el historial a la derecha.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-md p-10 shadow-sm flex flex-col items-center justify-center h-full min-h-[350px]">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Iniciar Nuevo Tema</h3>
              <p className="text-gray-500 mb-8 text-center max-w-md">No hay ninguna votación activa. Ingresa el nombre del tema a discutir para abrir la asistencia, la cola de palabra y el panel de votación a los consejeros.</p>
              <div className="w-full max-w-md flex flex-col gap-3">
                <input type="text" value={nuevoTema} onChange={(e) => setNuevoTema(e.target.value)} placeholder="Ej: Aprobación Presupuesto Educación 2027" className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"/>
                <button onClick={iniciarNuevaVotacion} disabled={!nuevoTema.trim()} className="w-full bg-[#1b5e20] hover:bg-[#144d18] text-white font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Abrir Tema y Votación</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {data.evento ? (
            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Cola de Palabra</h3>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">{data.solicitudes.length} en espera</span>
              </div>
              <div className="flex-grow overflow-y-auto pr-2">
                {data.solicitudes.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10"><p>Nadie ha solicitado la palabra.</p></div>
                ) : (
                  <ul className="space-y-3">
                    {data.solicitudes.map((solicitud, index) => (
                      <li key={solicitud.id} className={`flex items-center gap-3 p-3 border rounded transition-colors ${solicitud.status === 'HABLANDO' ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-100'}`}>
                        <div className={`${solicitud.status === 'HABLANDO' ? 'bg-green-600 animate-pulse' : 'bg-gray-800'} text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0`}>{index + 1}</div>
                        <div className="flex-grow">
                          <p className="text-sm font-semibold text-gray-800">{solicitud.nombre}{solicitud.status === 'HABLANDO' && <span className="ml-2 text-[10px] text-green-700 font-bold bg-green-200 px-2 py-0.5 rounded uppercase">Hablando</span>}</p>
                          <p className="text-xs text-gray-500">{new Date(solicitud.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                        </div>
                        <div className="flex gap-2">
                          {solicitud.status === 'PENDIENTE' ? (
                            <button onClick={() => darPalabra(solicitud.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-3 rounded uppercase tracking-wider">Dar</button>
                          ) : (
                            <button onClick={() => quitarPalabra(solicitud.id)} className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-1.5 px-3 rounded uppercase tracking-wider">Terminar</button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Temas Finalizados</h3>
                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded">En esta sesión</span>
              </div>
              <div className="flex-grow overflow-y-auto pr-2">
                {!data.historial || data.historial.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10"><p>Aún no hay temas votados en esta sesión.</p></div>
                ) : (
                  <ul className="space-y-4">
                    {data.historial.map((tema) => (
                      <li key={tema.id} className="p-4 border border-gray-100 rounded bg-gray-50/80 shadow-sm">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}