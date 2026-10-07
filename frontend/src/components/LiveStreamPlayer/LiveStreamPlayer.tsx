import { useState, useEffect } from "react";
import { Icon } from "../Icon/Icon"; 

const API_URL = '/api/votes';

export const LiveStreamPlayer = () => {
  const [oradorActual, setOradorActual] = useState<string | null>(null);
  const [votacionActiva, setVotacionActiva] = useState<string | null>(null);
  const [resultadosGrafica, setResultadosGrafica] = useState<{
    estado: 'EN VIVO' | 'OFICIAL';
    tituloTema: string;
    favor: number;
    contra: number;
    abstencion: number;
    total: number;
  } | null>(null);
  
  // Estado para saber si la sesión ya fue cerrada por el Presidente
  const [sesionFinalizada, setSesionFinalizada] = useState<boolean>(false);

  useEffect(() => {
    const fetchLiveGraphics = async () => {
      try {
        // Consultamos simultáneamente el dashboard en vivo y la lista de sesiones
        const [resDashboard, resSessions] = await Promise.all([
          fetch(`${API_URL}/dashboard/live`),
          fetch(`${API_URL}/sessions`)
        ]);

        if (resDashboard.ok && resSessions.ok) {
          const data = await resDashboard.json();
          const sesiones = await resSessions.json();
          
          // Verificamos el estado de la última sesión
          const ultimaSesion = sesiones.length > 0 ? sesiones[0] : null;
          const isClosed = ultimaSesion?.status === 'FINALIZADA';
          setSesionFinalizada(isClosed);

          // SI LA SESIÓN ESTÁ FINALIZADA: Limpiamos la pantalla y cortamos la función
          if (isClosed) {
            setOradorActual(null);
            setVotacionActiva(null);
            setResultadosGrafica(null);
            return; 
          }

          // SI LA SESIÓN ESTÁ ABIERTA: Procesamos la gráfica normalmente
          const hablando = data.solicitudes?.find((s: { status: string; nombre: string }) => s.status === 'HABLANDO');
          setOradorActual(hablando ? hablando.nombre : null);
          
          if (data.evento) {
            setVotacionActiva(data.evento.title);
            const favor = data.resultados?.favor || 0;
            const contra = data.resultados?.contra || 0;
            const abstencion = data.resultados?.abstencion || 0;
            
            setResultadosGrafica({
              estado: 'EN VIVO',
              tituloTema: data.evento.title,
              favor,
              contra,
              abstencion,
              total: favor + contra + abstencion
            });
            
          } else {
            setVotacionActiva(null);
            if (data.historial && data.historial.length > 0) {
              const ultimo = data.historial[0];
              setResultadosGrafica({
                estado: 'OFICIAL',
                tituloTema: ultimo.title,
                favor: ultimo.resultados?.favor || 0,
                contra: ultimo.resultados?.contra || 0,
                abstencion: ultimo.resultados?.abstencion || 0,
                total: ultimo.totalVotos
              });
            } else {
              setResultadosGrafica(null);
            }
          }
        }
      } catch (error) {
        console.error("Error cargando gráficas en vivo:", error);
      }
    };

    fetchLiveGraphics();
    const interval = setInterval(fetchLiveGraphics, 3000); 
    return () => clearInterval(interval);
  }, []);

  const calcularPorcentaje = (votos: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((votos / total) * 100);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-lg overflow-hidden bg-black shadow-2xl border border-gray-800">
      
      {/* FONDO DEL REPRODUCTOR (Cambia si está finalizada) */}
      <div className="w-full aspect-video bg-slate-900 flex flex-col items-center justify-center text-slate-500 relative">
        <div className={`absolute inset-0 opacity-30 bg-cover bg-center transition-all duration-1000 ${sesionFinalizada ? "bg-[url('https://placehold.co/1280x720/000000/333333?text=Transmisión+Finalizada')]" : "bg-[url('https://placehold.co/1280x720/0f172a/ffffff?text=Transmisión+En+Vivo')]"}`}></div>
        
        {!sesionFinalizada && (
          <div className="z-10 bg-black/60 px-4 py-2 rounded-full border border-gray-700 backdrop-blur-sm">
            <p className="animate-pulse text-gray-300 text-sm font-medium tracking-widest uppercase">Señal de Origen - Gobierno Regional</p>
          </div>
        )}
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        
        {/* Etiqueta Superior Izquierda (EN VIVO vs OFFLINE) */}
        {sesionFinalizada ? (
          <div className="absolute top-6 left-6 bg-gray-800 text-gray-400 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 shadow-lg border border-gray-700">
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
            OFFLINE
          </div>
        ) : (
          <div className="absolute top-6 left-6 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            EN VIVO
          </div>
        )}

        {/* GRÁFICA DE RESULTADOS */}
        {resultadosGrafica && !sesionFinalizada && (
          <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-5 py-4 rounded shadow-2xl w-64 border-t-4 border-gray-800 transition-all duration-700">
            <div className="mb-3 border-b border-gray-200 pb-2">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${resultadosGrafica.estado === 'EN VIVO' ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
                {resultadosGrafica.estado === 'EN VIVO' ? 'Resultados Parciales' : 'Resultados Oficiales'}
              </p>
              <p className="text-sm font-bold text-gray-800 leading-tight truncate" title={resultadosGrafica.tituloTema}>
                {resultadosGrafica.tituloTema}
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-green-700">A Favor</span>
                  <span>{resultadosGrafica.favor}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${calcularPorcentaje(resultadosGrafica.favor, resultadosGrafica.total)}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-red-700">En Contra</span>
                  <span>{resultadosGrafica.contra}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-red-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${calcularPorcentaje(resultadosGrafica.contra, resultadosGrafica.total)}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-600">Abstención</span>
                  <span>{resultadosGrafica.abstencion}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-gray-400 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${calcularPorcentaje(resultadosGrafica.abstencion, resultadosGrafica.total)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ZÓCALOS DINÁMICOS */}
        <div className="absolute bottom-24 left-8 flex flex-col gap-3">
          {votacionActiva && !sesionFinalizada && (
            <div className="bg-[#0d47a1]/90 backdrop-blur-sm text-white px-5 py-3 rounded-r-lg border-l-4 border-blue-400 shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-0.5">Votación en Curso</p>
              <p className="text-xl font-bold drop-shadow-md">{votacionActiva}</p>
            </div>
          )}

          {oradorActual && !sesionFinalizada && (
            <div className="bg-white/95 backdrop-blur-sm text-gray-900 px-5 py-3 rounded-r-lg border-l-4 border-[#2e7d32] shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#2e7d32] mb-0.5">En uso de la palabra</p>
              <p className="text-xl font-bold uppercase">{oradorActual}</p>
              <p className="text-xs text-gray-500 mt-0.5">Consejero Regional</p>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-4 z-20 pointer-events-auto">
        <button className={`px-4 py-1.5 rounded flex items-center gap-2 font-medium transition-colors ${sesionFinalizada ? 'bg-gray-700 text-gray-400' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          <Icon name="play" size={16} />
          <span>{sesionFinalizada ? 'Finalizado' : 'En Vivo'}</span>
        </button>
        <div className="flex-1 flex items-center gap-4 px-2">
          <button className="text-white hover:text-gray-300 transition-colors"><Icon name="arrowLeft" /></button>
          <div className="flex-1 h-1 bg-gray-600 rounded-full relative cursor-pointer">
            <div className={`absolute top-0 left-0 h-full rounded-full ${sesionFinalizada ? 'bg-gray-500' : 'bg-red-600'}`} style={{ width: `100%` }}>
              <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full shadow border-2 border-white ${sesionFinalizada ? 'bg-gray-500' : 'bg-red-600'}`} />
            </div>
          </div>
          <button className="text-white hover:text-gray-300 transition-colors"><Icon name="arrowRight" /></button>
        </div>
        <div className="flex items-center gap-4 text-white">
          <button className="hover:text-gray-300 transition-colors"><Icon name="plus" /></button>
          <button className="hover:text-gray-300 transition-colors"><Icon name="share" /></button>
          <button className="hover:text-gray-300 transition-colors"><Icon name="volume" /></button>
        </div>
      </div>
    </div>
  );
};