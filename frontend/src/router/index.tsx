import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/Login';
import SalaSesiones from '../pages/SalaSesiones';
import SesionEnCurso from '../pages/SalaPanelConsejoPage';
import { ROUTES } from '../constants/router/routes';
import SalaHistorialReunionPage from '../pages/SalaHistorialReunionPage';
import SalaAudioVisual from '../pages/SalaAudiovisual';
import { ProtectedRoute } from '../components/protectedRoute/ProtectedRoute';
import { PublicRoute } from '../components/publicRoute/PublicRoute';

export const router = createBrowserRouter([
  {
    // Rutas para no logueados
    element: <PublicRoute />,
    children: [
      {
        path: ROUTES.LOGIN.path,
        element: <Login />,
      },
    ],
  },
  {
    // Rutas accesibles para CUALQUIER usuario logueado
    element: <ProtectedRoute />,
    children: [
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
            path: ROUTES.SESION_EN_CURSO.path, 
            element: <SesionEnCurso /> 
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN']} />, 
    children: [
      {
        element: <MainLayout />,
        children: [
          { 
            path: ROUTES.SALA_AUDIOVISUAL.path, 
            element: <SalaAudioVisual /> 
          }
        ],
      },
    ],
  },
  {
    //Cualquier URL no válida redirige al login
    path: '*',
    element: <Navigate to={ROUTES.LOGIN.path} replace />,
  },
]);