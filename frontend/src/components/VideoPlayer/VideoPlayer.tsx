import { useState } from "react";
import { Icon } from "../Icon/Icon"; // Asegúrate de que la ruta sea correcta

export const VideoPlayer = () => {
  // Estado simulado para el progreso del video
  const [progress, setProgress] = useState(30); 

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-lg overflow-hidden bg-black shadow-lg">
      {/* Placeholder de la imagen de fondo del video */}
      <div className="w-full aspect-video bg-slate-800 flex items-center justify-center text-slate-500">
        {/* Reemplazar con: <img src="tu-imagen.jpg" alt="Sala audio visual" className="w-full h-full object-cover" /> */}
        [Placeholder Imagen del Video]
      </div>

      {/* Título Superpuesto */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h2 className="text-white text-3xl font-semibold tracking-wide drop-shadow-md">
          Sala audio visual
        </h2>
      </div>

      {/* Controles del Video */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center gap-4">
        
        {/* Botón Play */}
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded flex items-center gap-2 font-medium transition-colors">
          <Icon name="play" size={16} />
          <span>Play</span>
        </button>

        {/* Controles de navegación y progreso */}
        <div className="flex-1 flex items-center gap-4 px-2">
          <button className="text-white hover:text-gray-300 transition-colors">
            <Icon name="arrowLeft" />
          </button>
          
          {/* Barra de progreso */}
          <div className="flex-1 h-1 bg-gray-600 rounded-full relative cursor-pointer">
            <div 
              className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
              style={{ width: `${progress}%` }}
            >
              {/* Punto de progreso */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-red-600 rounded-full shadow" />
            </div>
          </div>

          <button className="text-white hover:text-gray-300 transition-colors">
            <Icon name="arrowRight" />
          </button>
        </div>

        {/* Controles de acción (Derecha) */}
        <div className="flex items-center gap-4 text-white">
          <button className="hover:text-gray-300 transition-colors"><Icon name="plus" /></button>
          <button className="hover:text-gray-300 transition-colors"><Icon name="share" /></button>
          <button className="hover:text-gray-300 transition-colors"><Icon name="volume" /></button>
        </div>
      </div>
    </div>
  );
};