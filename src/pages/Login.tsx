import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import AuthBackground from '../components/AuthBackground';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login, isAuthenticated, error } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!username || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }
    
    try {
      playSound('click');
      await login(username, password);
      playSound('win');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const toggleShowPassword = () => {
    playSound('click');
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-opacity-90 relative p-4">
      <AuthBackground />
      
      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-background-light rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex justify-center mb-6">
              <img 
                src="https://i.imgur.com/8JoHo9g.png" 
                alt="Horizon 777" 
                className="h-12 rounded-lg"
              />
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-6 neon-text">Entrar</h2>
            
            {errorMessage && (
              <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-md mb-4">
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-text-muted mb-1">
                  Nome de usuário
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  placeholder="Seu nome de usuário"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-text-muted mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-text-muted" />
                    ) : (
                      <Eye size={18} className="text-text-muted" />
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full btn-action py-3 font-semibold"
              >
                Entrar
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-text-muted">
                Não tem uma conta?{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primary-light"
                  onClick={() => playSound('click')}
                >
                  Registre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;