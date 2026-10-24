import { useState } from 'react';
import SessionHistoryTable from '../components/SessionHistoryTable/SessionHistoryTable';
import { AdminUploadSection } from '../components/AdminUploadSection/AdminUploadSection';

export default function SalaHistorialReunionPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleCloseModal = () => {
    setSelectedSessionId(null);
    setRefreshCounter(prev => prev + 1);
  };

  const handleUploadSuccess = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-[#f8f9fa] border-t border-gray-200">
      
      <aside className="w-full md:w-64 bg-white flex-shrink-0 pt-6">
        <nav className="flex flex-col">
          {/* enlaces del sidebar */}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-5xl">
          <SessionHistoryTable 
            onManageFiles={(id) => setSelectedSessionId(id)} 
            refreshTrigger={refreshCounter} 
          />
        </div>
      </main>

      {selectedSessionId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl z-10 transition-colors"
              title="Cerrar"
            >
              ✕
            </button>

            <div className="p-2">
              <AdminUploadSection 
                sessionId={selectedSessionId} 
                onUploadSuccess={handleUploadSuccess} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}