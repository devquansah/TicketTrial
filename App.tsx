import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EventPage from './pages/EventPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ValidationPage from './pages/ValidationPage';
import NotFoundPage from './pages/NotFoundPage';
import { getCurrentUser } from './utils/storage';

function App() {
  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/event/:id" element={<EventPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />
            <Route path="/validate" element={
              <AdminRoute>
                <ValidationPage />
              </AdminRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} TicketMaster. All rights reserved.
              </div>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Terms</a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy</a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default App;
