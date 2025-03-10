import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { useSound } from './contexts/SoundContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import GameDetails from './pages/GameDetails';
import DinoGame from './pages/DinoGame';
import Profile from './pages/Profile';
import Admin from './pages/Admin'; // Removida a extensão .tsx
import NotFound from './pages/NotFound';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const { initSounds } = useSound();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
    initSounds();
  }, [checkAuth, initSounds]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/deposit" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Deposit />
          </ProtectedRoute>
        } />
        <Route path="/withdraw" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Withdraw />
          </ProtectedRoute>
        } />
        <Route path="/game/:id" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <GameDetails />
          </ProtectedRoute>
        } />
        <Route path="/game/horizon777-dino-rex" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <DinoGame />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;