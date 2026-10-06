import { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  streamUrl: string;
}

export const LiveStreamPlayer = ({ streamUrl }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const [overlayText, setOverlayText] = useState('Sesión del Consejo Regional en curso');
  const [showOverlay, setShowOverlay] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true); 

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    if (total > 0) {
      setProgress((current / total) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (Number(e.target.value) / 100) * videoRef.current.duration;
    videoRef.current.currentTime = seekTime;
    setProgress(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full max-w-5xl mx-auto rounded-lg overflow-hidden bg-black shadow-2xl group"
    >
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full aspect-video object-contain cursor-pointer"
        autoPlay
        muted={isMuted}
        loop
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
      />

      <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg z-10">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        EN VIVO
      </div>

      {showOverlay && (
        <div className="absolute bottom-20 left-10 bg-black/70 text-white px-6 py-3 rounded-md backdrop-blur-sm border-l-4 border-red-600 shadow-lg z-10">
          {isEditing && user?.role === 'ADMIN' ? (
            <input
              type="text"
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="bg-transparent border-b border-white outline-none text-xl font-semibold text-white"
              autoFocus
            />
          ) : (
            <h2 
              className={`text-xl font-semibold tracking-wide ${user?.role === 'ADMIN' ? 'cursor-pointer hover:text-red-400' : ''}`}
              onClick={() => user?.role === 'ADMIN' && setIsEditing(true)}
              title={user?.role === 'ADMIN' ? "Clic para editar" : ""}
            >
              {overlayText}
            </h2>
          )}
        </div>
      )}

      {user?.role === 'ADMIN' && (
        <div className="absolute top-4 right-4 bg-black/80 p-4 rounded-lg text-white flex flex-col gap-2 z-10">
          <p className="text-xs font-bold text-gray-400 mb-1">PANEL DE TRANSMISIÓN</p>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input 
              type="checkbox" 
              checked={showOverlay} 
              onChange={(e) => setShowOverlay(e.target.checked)} 
            />
            Mostrar Gráfica
          </label>
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-red-600 hover:bg-red-700 text-xs px-3 py-1.5 rounded transition-colors"
          >
            Editar Texto
          </button>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        
        {/* Barra de Progreso */}
        <div className="flex items-center gap-3 w-full">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pausa */}
            <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-red-500 transition-colors">
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Pantalla Completa */}
            <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};