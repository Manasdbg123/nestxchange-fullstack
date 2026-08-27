import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        {/* The router lives here rather than inside App so that route-aware
            hooks are available to everything the providers render. */}
        <BrowserRouter>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>,
);
