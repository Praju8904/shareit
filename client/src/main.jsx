import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ShareProvider } from './context/ShareContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ShareProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1F2937',
              color: '#F1F5F9',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontFamily: "'Inter', sans-serif",
            },
            success: {
              iconTheme: {
                primary: '#00D4FF',
                secondary: '#1F2937',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#1F2937',
              },
            },
          }}
        />
      </ShareProvider>
    </BrowserRouter>
  </React.StrictMode>
);
