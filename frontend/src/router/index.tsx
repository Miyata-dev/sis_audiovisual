import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import SalaAudioVisual from '../pages/SalaAudiovisual';
import Login from '../pages/Login';
import SalaSesiones from '../pages/SalaSesiones';
import SesionEnCurso from '../pages/SalaPanelConsejoPage';
import { ROUTES } from '../constants/router/routes';
import SalaHistorialReunionPage from '../pages/SalaHistorialReunionPage';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { 
        path: ROUTES.HOME.path, 
        element: <SalaSesiones />
      },
      { 
        path: ROUTES.HISTORIAL_REUNION.path, 
        element: <SalaHistorialReunionPage />
      },
      { 
        path: ROUTES.SALA_AUDIOVISUAL.path, 
        element: <SalaAudioVisual />
      },
      { 
        path: ROUTES.SESION_EN_CURSO.path, 
        element: <SesionEnCurso />
      },
      { 
        path: ROUTES.LOGIN.path, 
        element: <Login />
      },
    ],
  },
]);