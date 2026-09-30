import React from 'react';
import { NavLink } from 'react-router-dom';
// Asegúrate de que esta ruta sea correcta según tu estructura de carpetas
// En tu captura, routes.ts está en src/constants/router/routes.ts
// y Navbar.tsx en src/components/NavBar/Navbar.tsx
import { ROUTES } from '../../constants/router/routes'; 

const Navbar = () => {
  // Definimos los enlaces en un array para mantener el código limpio
  const navItems = [
    { name: 'Bienvenido', path: ROUTES.HOME.path },
    { name: 'Sala Audiovisual', path: ROUTES.SALA_AUDIOVISUAL.path },
    { name: 'Sesión en Curso', path: ROUTES.SESION_EN_CURSO.path },
    { name: 'Login', path: ROUTES.LOGIN.path },
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center font-sans">
      {/* Sección Izquierda: Logo y Título */}
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

      {/* Sección Derecha: Enlaces y Botón */}
      <div className="hidden lg:flex items-center gap-6">
        {/* Enlaces de Navegación */}
        <ul className="flex items-center gap-6 text-sm text-gray-700">
          {navItems.map((item) => (
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

        {/* Botón de Login convertido en NavLink */}
        <NavLink
          to={ROUTES.LOGIN.path}
          className="bg-[#5ba85c] hover:bg-[#4a8f4b] text-white text-sm font-medium px-4 py-2 rounded-sm flex items-center gap-2 transition-colors"
        >
          Login
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </NavLink>
      </div>

      {/* Botón de menú hamburguesa para móviles */}
      <button className="lg:hidden text-gray-700 focus:outline-none">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </nav>
  );
};

export default Navbar;