import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/router/routes';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  roleId: z.coerce.number({ invalid_type_error: 'Seleccione un rol' }).int(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      roleId: 2, // Default -> 'CONSEJERO' 
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setServerError('');
      setSuccessMsg('');

      await axios.post('/api/auth/register', data);

      setSuccessMsg('Usuario registrado exitosamente. Redirigiendo al login...');
      
      setTimeout(() => {
        navigate(ROUTES.LOGIN.path);
      }, 2000);
    } catch (error: any) {
      console.error('Error en registro:', error);
      if (error.response && error.response.status === 409) {
        setServerError('El correo ya está registrado.');
      } else {
        setServerError('Ocurrió un error al registrar el usuario. Intente nuevamente.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#1b6b2e]">
            Crear una cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Regístrate para acceder al sistema
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
            {serverError}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700 text-sm rounded">
            {successMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input
                {...register('name')}
                type="text"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#5ba85c] focus:border-[#5ba85c] sm:text-sm`}
                placeholder="Juan Pérez"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input
                {...register('email')}
                type="email"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#5ba85c] focus:border-[#5ba85c] sm:text-sm`}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                {...register('password')}
                type="password"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#5ba85c] focus:border-[#5ba85c] sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol de Usuario</label>
              <select
                {...register('roleId')}
                className={`block w-full px-3 py-2 border ${
                  errors.roleId ? 'border-red-500' : 'border-gray-300'
                } bg-white text-gray-900 rounded-md focus:outline-none focus:ring-[#5ba85c] focus:border-[#5ba85c] sm:text-sm`}
              >
                <option value={1}>Consejero</option>
                <option value={2}>Administrador</option>
                <option value={3}>Presidente</option>
              </select>
              {errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#5ba85c] hover:bg-[#4a8f4b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5ba85c] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Registrando...' : 'Registrarse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}