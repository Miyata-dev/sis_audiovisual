import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { PreviousSession } from '../components/PreviousSeassion/PreviousSeassion';

const SalaAudioVisual = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col items-center">
      <VideoPlayer />
      <PreviousSession />
    </div>
  )
}

export default SalaAudioVisual;