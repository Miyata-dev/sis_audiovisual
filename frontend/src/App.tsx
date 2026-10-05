import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useEffect } from 'react';
import { backendURL } from './constants/api/backendURL';
import { AuthProvider } from './contexts/AuthContext';

const App = () => {
  useEffect(() => {
    fetch(backendURL)
      .then(data => {
        console.log('Backend response:', data);
      })
      .catch(error => {
        console.error('Backend connection failed:', error);
      });
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
};

export default App;