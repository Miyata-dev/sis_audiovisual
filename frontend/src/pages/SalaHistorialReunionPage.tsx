import React, { useState } from 'react';
import SessionHistoryTable from '../components/SessionHistoryTable/SessionHistoryTable';
import { AdminUploadSection } from '../components/AdminUploadSection/AdminUploadSection';

export default function SalaHistorialReunionPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Función para cerrar la modal
  const handleCloseModal = () => setSelectedSessionId(null);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-[#f8f9fa] border-t border-gray-200">
      
      {/* Barra Lateral Izquierda (Sidebar) */}
      <aside className="w-full md:w-64 bg-white flex-shrink-0 pt-6">
        <nav className="flex flex-col">
          {/* ... tus enlaces del sidebar ... */}
        </nav>
      </aside>

      {/* Contenido Principal Derecho */}
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-5xl">
          {/* ... tus títulos y buscador ... */}

          {/* 1. Le pasamos la función a la tabla */}
          <SessionHistoryTable onManageFiles={(id) => setSelectedSessionId(id)} />
          
        </div>
      </main>

      {/* 2. MODAL */}
      {selectedSessionId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleCloseModal} // Cierra al hacer clic en el fondo oscuro
        >
          {/* Caja de la Modal */}
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-fade-in"
            onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer clic dentro de la caja
          >
            {/* Botón de cerrar (X) */}
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl z-10 transition-colors"
              title="Cerrar"
            >
              ✕
            </button>

            {/* Contenido de la Modal */}
            <div className="p-2">
              {/* El AdminUploadSection ya trae sus propios estilos y padding */}
              <AdminUploadSection sessionId={selectedSessionId} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}