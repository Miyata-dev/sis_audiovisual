import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/router/routes';
import { useAuth } from '../../contexts/AuthContext'; // Asegura la ruta correcta

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Bienvenido', path: ROUTES.HOME.path, roles: ['ADMIN', 'COMUN'] },
    { name: 'Sala Audiovisual', path: ROUTES.SALA_AUDIOVISUAL.path, roles: ['ADMIN'] },
    { name: 'Sesión en Curso', path: ROUTES.SESION_EN_CURSO.path, roles: ['ADMIN', 'COMUN'] },
    { name: 'Historial de sesiones', path: ROUTES.HISTORIAL_REUNION.path, roles: ['ADMIN', 'COMUN'] },
  ];

  const filteredItems = navItems.filter(item => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN.path); 
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center font-sans">
      <div className="flex items-center gap-4">
        <img 
          src="/logo.png" 
          alt="Logo Gobierno Regional" 
          className="h-10 w-auto object-contain"
        />
        <h1 className="text-[#1b6b2e] font-bold text-lg md:text-xl tracking-tight">
          GOBIERNO REGIONAL DEL BIOBÍO
        </h1>
      </div>

      <div className="hidden lg:flex items-center gap-6">
        {user && (
          <ul className="flex items-center gap-6 text-sm text-gray-700">
            {filteredItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `transition-colors hover:text-[#1b6b2e] ${
                      isActive ? 'text-[#1b6b2e] font-semibold' : 'text-gray-700'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        )}

        {!user ? (
          <NavLink
            to={ROUTES.LOGIN.path}
            className="bg-[#5ba85c] hover:bg-[#4a8f4b] text-white text-sm font-medium px-4 py-2 rounded-sm flex items-center gap-2 transition-colors"
          >
            Login
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </NavLink>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium">Hola, {user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-sm transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      <button className="lg:hidden text-gray-700 focus:outline-none">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </nav>
  );
};

export default Navbar;