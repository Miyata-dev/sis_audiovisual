import { Icon } from "../Icon/Icon"; 

// ==========================================
// 3. Componente PreviousSession
// Principio: Componente de presentación (UI) puro.
// ==========================================
export const PreviousSession = () => {
  return (
    <div className="w-full max-w-4xl mx-auto mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-6">
      
      {/* Miniatura (Thumbnail) */}
      <div className="relative w-48 h-28 bg-gray-200 rounded overflow-hidden flex-shrink-0 group cursor-pointer">
        {/* Reemplazar con: <img src="tu-miniatura.jpg" alt="Miniatura" className="w-full h-full object-cover" /> */}
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          [Placeholder Miniatura]
        </div>
        
        {/* Overlay de Play en miniatura */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center pl-1">
            <Icon name="play" size={12} className="text-white" />
          </div>
        </div>
        
        {/* Duración */}
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
          1:40
        </div>
      </div>

      {/* Información y Botón */}
      <div className="flex flex-col gap-3">
        <span className="text-gray-600 text-sm font-medium">
          Reproducir sesión anterior
        </span>
        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded flex items-center gap-2 font-medium transition-colors w-fit shadow-sm">
          <Icon name="play" size={16} />
          <span>Volver</span>
        </button>
      </div>
      
    </div>
  );
};
