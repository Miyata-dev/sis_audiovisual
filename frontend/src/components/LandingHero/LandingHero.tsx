import { useNavigate } from 'react-router-dom';
import { Monitor } from 'lucide-react'; 
import { ROUTES } from '../../constants/router/routes';

export const LandingHero = () => {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate(ROUTES.LOGIN.path); // TODO cambiarlo a register
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-12">
        
        <div className="flex-1 space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-700 tracking-wide uppercase">
            Gobierno Regional del Biobío
          </h2>
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-600 leading-tight">
            Sistema de audio visión
          </h1>
          
          <div className="pt-4">
            <button
              onClick={handleRegisterClick}
              className="px-8 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition-colors shadow-sm"
            >
              Login
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center">
          <div className="relative w-full max-w-md h-64 md:h-80 bg-gray-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <Monitor size={120} className="text-green-500 opacity-50" />
            <p className="absolute bottom-4 text-sm text-gray-500"><img src="/Illustration.png" alt="Ilustración" /></p>
          </div>
        </div>
        
      </div>
    </div>
  );
};