import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DeploymentProvider, useDeployments } from './context/DeploymentContext';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import DeploymentDetailPage from './pages/DeploymentDetailPage';
import ProjectEditorPage from './pages/ProjectEditorPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// A wrapper to redirect unauthenticated admins back to the login gateway
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useDeployments();

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid var(--accent-secondary-muted)',
          borderTopColor: 'var(--accent-secondary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ fontSize: '0.9rem', letterSpacing: '0.3px', fontWeight: 600 }}>Restoring admin session console...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Serves the public landing page to unauthenticated guests, and the dashboard to logged-in owners
function HomeRoute() {
  const { isAuthenticated, authLoading } = useDeployments();

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid var(--accent-secondary-muted)',
          borderTopColor: 'var(--accent-secondary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ fontSize: '0.9rem', letterSpacing: '0.3px', fontWeight: 600 }}>Restoring admin session console...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return isAuthenticated ? <DashboardPage /> : <LandingPage />;
}

export default function App() {
  return (
    <DeploymentProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRoute />} />
          <Route path="/deployment/:id" element={<ProtectedRoute><DeploymentDetailPage /></ProtectedRoute>} />
          <Route path="/project/:id/edit" element={<ProtectedRoute><ProjectEditorPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </DeploymentProvider>
  );
}

