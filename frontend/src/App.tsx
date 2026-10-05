import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { BooksPage } from './pages/BooksPage';
import { IssuePage } from './pages/IssuePage';
import { MemberHistoryPage } from './pages/MemberHistoryPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-default)',
            fontSize: '0.9rem',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/books" replace />} />
            <Route path="books" element={<BooksPage />} />
            <Route path="issue" element={<IssuePage />} />
            <Route path="history" element={<MemberHistoryPage />} />
            <Route path="members/history" element={<MemberHistoryPage />} />
            <Route path="members/:memberId/history" element={<MemberHistoryPage />} />
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
