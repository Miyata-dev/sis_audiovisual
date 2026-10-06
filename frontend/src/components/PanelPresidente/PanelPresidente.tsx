import React, { useState, useEffect, useCallback } from 'react';

type Solicitud = {
  id: number;
  nombre: string;
  hora: string;
  status: string; 
};

type DashboardData = {
  evento: { id: number; title: string; status: string; sessionId: number } | null;
  resultados: Record<string, number>;
  asistentes: string[];
  solicitudes: Solicitud[];
};

export default function PanelPresidente() {
  const [data, setData] = useState<DashboardData>({
    evento: null,
    resultados: {},
    asistentes: [],
    solicitudes: []
  });

  const cargarDashboard = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/votes/dashboard/live');
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      }
    } catch (error) {
      console.error('Error al cargar dashboard en vivo:', error);
    }
  }, []); 

  // Efecto de Polling: Consulta los datos cada 3 segundos
  useEffect(() => {
    const init = async () => {
      await cargarDashboard();
    };
    init();

    const intervalo = setInterval(() => {
      cargarDashboard();
    }, 3000);

    return () => clearInterval(intervalo);
  }, [cargarDashboard]);

  // Función para cerrar la votación actual
  const cerrarVotacion = async () => {
    if (!data.evento) return;
    
    if (!window.confirm('¿Estás seguro de que deseas cerrar esta votación? Los consejeros ya no podrán emitir más votos.')) return;

    try {
      const response = await fetch('http://localhost:3000/api/votes/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votingEventId: data.evento.id }),
      });

      if (response.ok) {
        alert('Votación cerrada correctamente.');
        cargarDashboard(); 
      } else {
        alert('Hubo un error al cerrar la votación.');
      }
    } catch (error) {
      console.error('Error al cerrar votación:', error);
    }
  };

  // RF-4: Funciones para gestionar la palabra
  const darPalabra = async (id: number) => {
    try {
      await fetch('http://localhost:3000/api/votes/speak/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId: id }),
      });
      cargarDashboard(); // Actualiza inmediatamente la UI
    } catch (error) {
      console.error('Error al dar la palabra:', error);
    }
  };

  const quitarPalabra = async (id: number) => {
    try {
      await fetch('http://localhost:3000/api/votes/speak/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId: id }),
      });
      cargarDashboard(); // Actualiza inmediatamente la UI
    } catch (error) {
      console.error('Error al terminar la palabra:', error);
    }
  };

  // Extraemos los votos de forma segura
  const votosFavor = data.resultados['favor'] || 0;
  const votosContra = data.resultados['contra'] || 0;
  const votosAbstencion = data.resultados['abstencion'] || 0;
  const totalVotos = votosFavor + votosContra + votosAbstencion;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-gray-50/50 min-h-screen">
      
      {/* CABECERA DEL PRESIDENTE */}
      <div className="bg-[#1b5e20] rounded-md p-6 flex flex-col md:flex-row items-center justify-between shadow-md text-white">
        <div>
          <span className="bg-red-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">
            Vista Moderador (En Vivo)
          </span>
          <h1 className="text-3xl font-bold">Panel de Control: Sesión Ordinaria N°10</h1>
          <p className="text-[#a5d6a7] mt-1">Gobernador Regional del Biobío</p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-xl font-bold">
            Asistencia: {data.asistentes.length} <span className="text-sm font-normal text-[#a5d6a7]">/ 29 Consejeros</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: RESULTADOS DE VOTACIÓN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Votación Activa: {data.evento ? data.evento.title : 'Ninguna'}
              </h3>
              
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {totalVotos} Votos Emitidos
                </span>
                
                {/* BOTÓN CERRAR VOTACIÓN */}
                {data.evento && (
                  <button 
                    onClick={cerrarVotacion}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1.5 px-4 rounded transition-colors shadow-sm"
                  >
                    Cerrar Votación
                  </button>
                )}
              </div>
            </div>

            {/* Contadores */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[#e8f5e9] border border-[#a5d6a7] rounded-lg p-4 text-center">
                <p className="text-gray-600 font-semibold mb-1">A Favor</p>
                <p className="text-4xl font-bold text-[#2e7d32]">{votosFavor}</p>
              </div>
              <div className="bg-[#ffebee] border border-[#ef9a9a] rounded-lg p-4 text-center">
                <p className="text-gray-600 font-semibold mb-1">En Contra</p>
                <p className="text-4xl font-bold text-[#c62828]">{votosContra}</p>
              </div>
              <div className="bg-[#eceff1] border border-[#b0bec5] rounded-lg p-4 text-center">
                <p className="text-gray-600 font-semibold mb-1">Abstención</p>
                <p className="text-4xl font-bold text-[#455a64]">{votosAbstencion}</p>
              </div>
            </div>

            {/* Barras de progreso visuales */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 text-gray-600">
                  <span>A Favor</span>
                  <span>{totalVotos > 0 ? Math.round((votosFavor / totalVotos) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-[#4CAF50] h-2.5 rounded-full transition-all duration-500" style={{ width: `${totalVotos > 0 ? (votosFavor / totalVotos) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 text-gray-600">
                  <span>En Contra</span>
                  <span>{totalVotos > 0 ? Math.round((votosContra / totalVotos) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-[#e53935] h-2.5 rounded-full transition-all duration-500" style={{ width: `${totalVotos > 0 ? (votosContra / totalVotos) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* COLUMNA DERECHA: COLA DE PALABRA */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Cola de Palabra</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                {data.solicitudes.length} en espera
              </span>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
              {data.solicitudes.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <p>Nadie ha solicitado la palabra.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.solicitudes.map((solicitud, index) => (
                    <li 
                      key={solicitud.id} 
                      className={`flex items-center gap-3 p-3 border rounded transition-colors ${
                        solicitud.status === 'HABLANDO' ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className={`${solicitud.status === 'HABLANDO' ? 'bg-green-600 animate-pulse' : 'bg-gray-800'} text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-grow">
                        <p className="text-sm font-semibold text-gray-800">
                          {solicitud.nombre}
                          {solicitud.status === 'HABLANDO' && (
                            <span className="ml-2 text-[10px] text-green-700 font-bold bg-green-200 px-2 py-0.5 rounded uppercase">
                              Hablando
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(solicitud.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {solicitud.status === 'PENDIENTE' ? (
                          <button 
                            onClick={() => darPalabra(solicitud.id)} 
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-3 rounded uppercase tracking-wider"
                          >
                            Dar
                          </button>
                        ) : (
                          <button 
                            onClick={() => quitarPalabra(solicitud.id)} 
                            className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-1.5 px-3 rounded uppercase tracking-wider"
                          >
                            Terminar
                          </button>
                        )}
                      </div>

                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}