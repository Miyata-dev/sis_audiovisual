import React, { useEffect, useState } from 'react';

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

export default function SessionHistoryTable() {
  const [sesiones, setSesiones] = useState<Session[]>([]);
  const [cargando, setCargando] = useState(true);

  const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : '';

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
  }, [baseUrl]);

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
                  {/* Video */}
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

                  {/* Transcripción */}
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

                  {/* Acta */}
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}