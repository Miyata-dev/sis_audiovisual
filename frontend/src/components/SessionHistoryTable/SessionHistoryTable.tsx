import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; 

interface Session {
  id: number;
  title: string;
  date: string;
  status: string;
  videoUrl?: string;
  theme?: string;
  duration?: string;
  thumbnailUrl?: string;
  actaUrl?: string;
  transcriptionUrl?: string;
}

interface Props {
  onManageFiles: (sessionId: number) => void;
}

export default function SessionHistoryTable({ onManageFiles }: Props) {
  const [sesiones, setSesiones] = useState<Session[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const { user } = useAuth();

  const baseUrl = '';

  useEffect(() => {
    fetch(`${baseUrl}/api/sessions/history`)
      .then((res) => res.json())
      .then((data) => {
        setSesiones(data);
        setCargando(false);
      })
      .catch((error) => {
        console.error('Error al cargar sesiones:', error);
        setCargando(false);
      });
  }, []);


  const descargarReporteConsolidado = async (sessionId: number, tituloSesion: string) => {
    try {
      const res = await fetch(`/api/votes/report/session?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const nombreSeguro = tituloSesion.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute('download', `reporte_completo_${nombreSeguro}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Error al generar el reporte de la sesión. Asegúrate de que el backend esté actualizado.');
      }
    } catch (error) {
      console.error('Error descargando reporte:', error);
  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la sesión en el servidor');
      }

      setSesiones((prevSesiones) => prevSesiones.filter((s) => s.id !== id));
      alert('Sesión eliminada correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al intentar eliminar la sesión.');
    }
  };

  if (cargando) {
    return <div className="p-6 text-gray-500">Cargando historial de sesiones...</div>;
  }

  return (
    <div className="border border-gray-400 bg-white p-6 rounded-sm w-full">
      <h3 className="text-xl font-bold text-[#2d3748] mb-6">Sesiones recientes</h3>

      <div className="flex flex-col gap-4">
        {sesiones.length === 0 ? (
          <p className="text-gray-500">No hay sesiones registradas.</p>
        ) : (
          sesiones.map((session) => {
            const fechaFormateada = new Date(session.date).toLocaleDateString('es-CL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const imagenFondo = session.thumbnailUrl
              ? `${baseUrl}${session.thumbnailUrl}`
              : 'https://placehold.co/400x225/e2e8f0/475569?text=Sin+Miniatura';

            return (
              <div
                key={session.id}
                className="flex flex-col md:flex-row gap-6 p-4 border border-gray-100 bg-white shadow-sm rounded-sm"
              >
                {/* Miniatura */}
                <div className="relative w-full md:w-56 h-32 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                  <img
                    src={imagenFondo}
                    alt="Miniatura de sesión"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white opacity-90"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {session.duration || '--:--'}
                  </span>
                </div>

                {/* Información */}
                <div className="flex flex-col justify-center flex-grow">
                  <h4 className="text-lg font-medium text-gray-800">{session.title}</h4>
                  <div className="flex items-center text-xs text-gray-400 mt-1 mb-2">
                    <svg
                      className="w-3.5 h-3.5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                    {fechaFormateada} hrs
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Tema: {session.theme || 'Sin tema especificado'}
                  </p>

                  <div className="flex gap-2">
                    {session.videoUrl && (
                      <span className="flex items-center text-[11px] font-medium bg-[#4CAF50] text-white px-2 py-1 rounded-sm">
                        Video
                      </span>
                    )}
                    {session.transcriptionUrl && (
                      <span className="flex items-center text-[11px] font-medium bg-blue-500 text-white px-2 py-1 rounded-sm">
                        Transcripción
                      </span>
                    )}
                    {session.actaUrl && (
                      <span className="flex items-center text-[11px] font-medium bg-purple-500 text-white px-2 py-1 rounded-sm">
                        Acta
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col items-end gap-2 md:ml-auto justify-center">
                  
                  {/* Se corrigió la lógica agregando paréntesis alrededor de las condiciones de rol */}
                  {(user?.role === 'ADMIN' || user?.role === 'PRESIDENTE') && (
                    <>
                      <button
                        onClick={() => {
                          console.log(`Gestionando archivos para la sesión con ID: ${session.id}`);
                          onManageFiles(session.id);
                        }}
                        className="flex items-center justify-center w-full md:w-40 px-3 py-1.5 bg-blue-600 rounded text-sm text-white font-medium hover:bg-blue-700 transition-colors"
                      >
                        Gestionar Archivos
                      </button>

                      {/* Nuevo botón de Eliminar */}
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="flex items-center justify-center w-full md:w-40 px-3 py-1.5 bg-red-600 rounded text-sm text-white font-medium hover:bg-red-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          ></path>
                        </svg>
                        Eliminar
                      </button>
                    </>
                  )}

                  {session.videoUrl ? (
                    <a
                      href={`${baseUrl}${session.videoUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full md:w-40 px-3 py-1.5 border border-gray-400 rounded text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Ver sesión
                    </a>
                  ) : (
                    <button
                      disabled
                      className="opacity-50 cursor-not-allowed flex items-center justify-center w-full md:w-40 px-3 py-1.5 border border-gray-400 rounded text-sm text-gray-700 font-medium"
                    >
                      Sin video
                    </button>
                  )}

                  {session.transcriptionUrl ? (
                    <a
                      href={`${baseUrl}${session.transcriptionUrl}`}
                      download
                      className="flex items-center justify-center w-full md:w-40 px-3 py-1.5 border border-blue-400 rounded text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                      </svg>
                      Transcripción
                    </a>
                  ) : (
                    <button
                      disabled
                      className="opacity-50 cursor-not-allowed flex items-center justify-center w-full md:w-40 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-400 font-medium"
                    >
                      Sin transcripción
                    </button>
                  )}

                  {session.actaUrl ? (
                    <a
                      href={`${baseUrl}${session.actaUrl}`}
                      download
                      className="flex items-center justify-center w-full md:w-40 px-3 py-1.5 bg-[#4CAF50] rounded text-sm text-white font-medium hover:bg-[#43a047] transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        ></path>
                      </svg>
                      Descargar acta
                    </a>
                  ) : (
                    <button
                      disabled
                      className="opacity-50 cursor-not-allowed flex items-center justify-center w-full md:w-40 px-3 py-1.5 bg-gray-400 rounded text-sm text-white font-medium"
                    >
                      Sin acta
                    </button>
                  )}

                  {/* Reporte de Votaciones Generado Automáticamente */}
                  <button
                    onClick={() => descargarReporteConsolidado(session.id, session.title)}
                    className="flex items-center justify-center w-full md:w-40 px-3 py-1.5 border border-blue-500 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    <svg 
                      className="w-4 h-4 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    Reporte Votos
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}