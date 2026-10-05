import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User } from 'lucide-react';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().email('El email no es válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError('');
    
    try {
      const response = await axios.post('api/auth/login', data);
      
      console.log('Login exitoso:', response.data);
      
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-10 bg-slate-50 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
        Bienvenido
      </h1>

      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
          <User size={48} className="text-white" fill="white" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <input
            {...register('email')}
            placeholder="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            {...register('password')}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="text-left">
          <a href="#" className="text-xs text-gray-600 hover:text-gray-900">
            Forgot Password ?
          </a>
        </div>

        {serverError && (
          <p className="text-red-500 text-sm text-center font-medium">{serverError}</p>
        )}

        <div className="flex justify-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 bg-blue-400 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 font-medium"
          >
            {isLoading ? 'Cargando...' : 'Login'}
          </button>
          
          <button
            type="button"
            className="px-8 py-2.5 bg-green-400 hover:bg-green-500 text-white rounded-md transition-colors font-medium"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
};