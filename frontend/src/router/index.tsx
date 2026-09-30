import { createBrowserRouter } from 'react-router-dom';

// Importa tus componentes y layouts
import MainLayout from '../layouts/MainLayout';
import { ROUTES } from '../constants/router/routes';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { 
        path: ROUTES.HOME.path, 
        element: <h1>Sesiones</h1>
      },
      { 
        path: ROUTES.SALA_AUDIOVISUAL.path, 
        element: <h1>Sala audiovisual</h1>
      },
      { 
        path: ROUTES.SESION_EN_CURSO.path, 
        element: <h1>Sesión en curso</h1>
      },
      { 
        path: ROUTES.LOGIN.path, 
        element: <h1>Login</h1>
      },
    ],
  },
]);