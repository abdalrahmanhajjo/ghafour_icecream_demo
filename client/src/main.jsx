import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './state.jsx';
import Home from './pages/Home.jsx';
import Admin from './admin/Admin.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AppProvider>
                <Home />
              </AppProvider>
            }
          />
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
