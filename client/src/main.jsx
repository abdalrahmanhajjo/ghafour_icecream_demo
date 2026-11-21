import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './state.jsx';
import Home from './pages/Home.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
// Self-hosted variable fonts (no third-party font request; works with the strict CSP)
import '@fontsource-variable/cairo';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/fraunces';
import './styles.css';
import './a11y.css';

// Admin is code-split: storefront visitors never download the dashboard bundle.
const Admin = lazy(() => import('./admin/Admin.jsx'));

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/"
            element={
              <AppProvider>
                <Home />
              </AppProvider>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f4f6f8' }} />}>
                <Admin />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
