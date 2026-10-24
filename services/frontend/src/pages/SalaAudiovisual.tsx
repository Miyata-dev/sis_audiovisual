import { useState } from 'react';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { LiveStreamPlayer } from '../components/LiveStreamPlayer/LiveStreamPlayer';

const SalaAudioVisual = () => {
  const [isLive, setIsLive] = useState(true); 
  
  const fakeStreamUrl = '/api/streams/sesion-en-vivo.mp4';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col items-center">
      {isLive ? (
        <LiveStreamPlayer streamUrl={fakeStreamUrl} />
      ) : (
        <VideoPlayer />
      )}
    </div>
  );
};

export default SalaAudioVisual;