import React from 'react';

const mockSessions = [
  {
    id: 1,
    title: 'Sesión Ordinaria N°10',
    date: '28 de agosto de 2026 - 10:00 hrs',
    theme: 'Presupuesto regional 2026',
    duration: '1:42:36',
    thumbnail: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80&w=400&h=225'
  },
  {
    id: 2,
    title: 'Sesión Extraordinaria N°15',
    date: '28 de agosto de 2026 - 10:00 hrs',
    theme: 'Emergencia climática regional',
    duration: '1:36:20',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400&h=225'
  },
  {
    id: 3,
    title: 'Sesión Ordinaria N°20',
    date: '28 de agosto de 2026 - 10:00 hrs',
    theme: 'Plan de Desarrollo Regional',
    duration: '2:15:08',
    thumbnail: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=400&h=225'
  }
];

export default function SessionHistoryTable() {
  return (
    <div className="border border-gray-400 bg-white p-6 rounded-sm w-full">
      <h3 className="text-xl font-bold text-[#2d3748] mb-6">Sesiones recientes</h3>
      
      <div className="flex flex-col gap-4">
        {mockSessions.map((session) => (
          <div key={session.id} className="flex flex-col md:flex-row gap-6 p-4 border border-gray-100 bg-white shadow-sm rounded-sm">
            
            {/* Thumbnail del Video */}
            <div className="relative w-full md:w-56 h-32 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
              <img src={session.thumbnail} alt="Miniatura de sesión" className="object-cover w-full h-full opacity-90" />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <svg className="w-10 h-10 text-white opacity-90" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                {session.duration}
              </span>
            </div>

            <div className="flex flex-col justify-center flex-grow">
              <h4 className="text-lg font-medium text-gray-800">{session.title}</h4>
              <div className="flex items-center text-xs text-gray-400 mt-1 mb-2">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {session.date}
              </div>
              <p className="text-sm text-gray-600 mb-3">Tema: {session.theme}</p>
              
              <div className="flex gap-2">
                <span className="flex items-center text-[11px] font-medium bg-[#4CAF50] text-white px-2 py-1 rounded-sm">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>
                  Video
                </span>
                <span className="flex items-center text-[11px] font-medium border border-gray-300 text-gray-600 px-2 py-1 rounded-sm">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Transcripción
                </span>
                <span className="flex items-center text-[11px] font-medium border border-gray-300 text-gray-600 px-2 py-1 rounded-sm">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                  Votaciones
                </span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 md:ml-auto">
              <button className="flex items-center justify-center w-full md:w-auto px-4 py-2 border border-gray-400 rounded text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                Ver sesión
              </button>
              <button className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-[#4CAF50] rounded text-sm text-white font-medium hover:bg-[#43a047] transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Descargar acta
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}