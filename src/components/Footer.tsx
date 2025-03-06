import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Gamepad2, Wallet, User, LogOut } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../api';

interface UserProfile {
  username: string;
  balance: number;
  lastLogin: string;
}

const Footer: React.FC = () => {
  const { pathname } = useLocation();
  const { playSound } = useSound();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await userAPI.getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleClick = () => {
    playSound('click');
  };

  const scrollToGames = () => {
    playSound('click');
    if (pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        const gamesSection = document.querySelector('#all-games');
        if (gamesSection) {
          gamesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const gamesSection = document.querySelector('#all-games');
      if (gamesSection) {
        gamesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogout = async () => {
    playSound('click');
    await logout();
  };

  return (
    <>
      {/* Desktop Footer */}
      <footer className="hidden md:block bg-background-light py-6 mt-auto">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <img 
                src="https://i.imgur.com/8JoHo9g.png" 
                alt="Horizon 777" 
                className="h-8"
              />
              <p className="text-text-muted text-sm mt-2">
                © 2025 Horizon 777. Todos os direitos reservados.
              </p>
            </div>
            
            <div className="flex space-x-6">
              <Link to="/" className="text-text-muted hover:text-text transition-colors" onClick={handleClick}>
                Home
              </Link>
              <Link to="/deposit" className="text-text-muted hover:text-text transition-colors" onClick={handleClick}>
                Depositar
              </Link>
              <Link to="/withdraw" className="text-text-muted hover:text-text transition-colors" onClick={handleClick}>
                Sacar
              </Link>
              <button onClick={handleLogout} className="text-text-muted hover:text-text transition-colors">
                Sair
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background-light border-t border-background-lighter z-30">
        <div className="grid grid-cols-5 h-16">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center ${pathname === '/' ? 'text-action' : 'text-text-muted'}`}
            onClick={handleClick}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Menu</span>
          </Link>
          
          <Link 
            to="#"
            className="flex flex-col items-center justify-center text-text-muted"
            onClick={scrollToGames}
          >
            <Gamepad2 size={20} />
            <span className="text-xs mt-1">Jogos</span>
          </Link>
          
          <Link 
            to="/deposit" 
            className={`flex flex-col items-center justify-center ${pathname === '/deposit' ? 'text-action' : 'text-text-muted'}`}
            onClick={handleClick}
          >
            <Wallet size={20} />
            <span className="text-xs mt-1">Depositar</span>
          </Link>
          
          <Link 
            to="/profile" 
            className={`flex flex-col items-center justify-center ${pathname === '/profile' ? 'text-action' : 'text-text-muted'}`}
            onClick={handleClick}
          >
            <User size={20} />
            <span className="text-xs mt-1">Conta</span>
          </Link>
          
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center justify-center text-text-muted"
          >
            <LogOut size={20} />
            <span className="text-xs mt-1">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Footer;