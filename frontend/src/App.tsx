import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useEffect } from 'react';
import { backendURL } from './constants/api/backendURL';

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

  return <RouterProvider router={router} />;
};

export default App;