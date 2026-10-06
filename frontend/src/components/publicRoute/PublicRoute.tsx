import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants/router/routes';
import { useAuth } from '../../contexts/AuthContext';

// Evita que usuarios logueados vean el Login
export const PublicRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to={ROUTES.HOME.path} replace /> : <Outlet />;
};