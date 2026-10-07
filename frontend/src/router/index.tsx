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
import PanelPresidente from "../components/PanelPresidente/PanelPresidente.tsx";
import Register from '../pages/Register.tsx';

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
    // Rutas accesibles para CUALQUIER usuario logueado (Consejeros, Presidente, Admin)
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
          { 
            path: ROUTES.SALA_AUDIOVISUAL.path, 
            element: <SalaAudioVisual /> 
          },
        ],
      },
    ],
  },
  { 
    // Este solo lo ve el admin 
    element: <ProtectedRoute allowedRoles={['ADMIN']} />, 
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: ROUTES.REGISTER.path, 
            element: <Register />,
          },
        ]
      }
    ]
  },
  {
    // PROTECCIÓN DE ROLES: Solo Admin y Presidente pueden ver el panel de control
    element: <ProtectedRoute allowedRoles={['ADMIN', 'PRESIDENTE']} />, 
    children: [
      {
        element: <MainLayout />,
        children: [
          { 
            path: '/panel-presidente', 
            element: <PanelPresidente /> 
          },
        ],
      },
    ],
  },
  {
    // Cualquier URL no válida redirige al login
    path: '*',
    element: <Navigate to={ROUTES.LOGIN.path} replace />,
  },
]);