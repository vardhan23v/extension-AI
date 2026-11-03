import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import AppShell, { StudioRedirect } from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { Spinner } from './components/ui';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NewProjectPage = lazy(() => import('./pages/NewProjectPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const SecurityCenterPage = lazy(() => import('./pages/SecurityCenterPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PublishingPage = lazy(() => import('./pages/PublishingPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const SharedViewPage = lazy(() => import('./pages/SharedViewPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Spinner />
  </div>
);

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

const toastStyle = {
  style: {
    background: 'rgb(var(--bg))',
    color: 'rgb(var(--fg))',
    border: '1px solid rgb(var(--border))',
    borderRadius: '8px',
    fontSize: '14px',
    whiteSpace: 'pre-line',
  },
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Toaster position="bottom-right" toastOptions={toastStyle} />
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/shared/:id" element={<SharedViewPage />} />
              {!isAuthenticated && <Route path="/templates" element={<TemplatesPage />} />}
              {!isAuthenticated && <Route path="/gallery" element={<GalleryPage />} />}
            </Route>

            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/new" element={<NewProjectPage />} />
              <Route path="/generate" element={<Navigate to="/new" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<WorkspacePage />} />
              <Route path="/studio" element={<StudioRedirect />} />
              <Route path="/security" element={<SecurityCenterPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/publishing" element={<PublishingPage />} />
              {isAuthenticated && <Route path="/templates" element={<TemplatesPage />} />}
              {isAuthenticated && <Route path="/gallery" element={<GalleryPage />} />}
            </Route>

            <Route element={<PublicLayout />}>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
