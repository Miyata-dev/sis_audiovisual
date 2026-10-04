import React from 'react';
import SessionHistoryTable from '../components/SessionHistoryTable/SessionHistoryTable';

export default function SalaHistorialReunionPage() {
  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-[#f8f9fa] border-t border-gray-200">
      
      {/* Barra Lateral Izquierda (Sidebar) */}
      <aside className="w-full md:w-64 bg-white flex-shrink-0 pt-6">
        <nav className="flex flex-col">
          <a href="#" className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gray-50">
            <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Panel de Sesión
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-sm font-medium text-[#2d3748] bg-[#eef7ee] border-l-4 border-[#4CAF50]">
            <svg className="w-5 h-5 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Historial
          </a>
        </nav>
      </aside>

      {/* Contenido Principal Derecho */}
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-5xl">
          {/* Título y Subtítulo */}
          <h2 className="text-[28px] font-bold text-[#2d3748] mb-1">Historial de Sesiones</h2>
          <p className="text-[15px] text-[#828bb1] mb-6">
            Consulta y accede a los registros de sesiones anteriores del Consejo Regional
          </p>

          {/* Barra de Búsqueda */}
          <div className="relative mb-10 w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              placeholder="Buscar por sesión, tema o palabra clave" 
              className="pl-10 pr-4 py-2 w-full border border-gray-500 rounded text-sm focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50]"
            />
          </div>

          {/* Componente de la lista de tarjetas que acabamos de modificar */}
          <SessionHistoryTable />
          
        </div>
      </main>
    </div>
  );
}