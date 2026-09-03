import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HubProvider } from './context/HubContext';
import './index.css';
import './theme/hrivo.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HubProvider>
      <App />
    </HubProvider>
  </React.StrictMode>
);
