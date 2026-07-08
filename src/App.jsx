import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import NotFound from './pages/NotFound';

import Login from './pages/Login';
import Register from './pages/Register';
import ChallengeList from './pages/ChallengeList';
import ChallengeDetail from './pages/ChallengeDetail';
import ContestList from './pages/ContestList';
import ContestDetail from './pages/ContestDetail';
import Profile from './pages/Profile';
import ChallengeBuilder from './pages/admin/ChallengeBuilder';
import ContestBuilder from './pages/admin/ContestBuilder';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
              <Routes>
                {/* Public */}
                <Route path="/" element={<ChallengeList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/challenges/:id" element={<ChallengeDetail />} />
                <Route path="/contests" element={<ContestList />} />
                <Route path="/contests/:id" element={<ContestDetail />} />

                {/* Protected */}
                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />

                {/* Admin only */}
                <Route path="/admin/challenges/create" element={
                  <AdminRoute><ChallengeBuilder /></AdminRoute>
                } />
                <Route path="/admin/contests/create" element={
                  <AdminRoute><ContestBuilder /></AdminRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}