import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Wallet, Languages, ChevronDown, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext'; 
import { userAPI } from '../api';

const languageOptions = [
  { code: 'pt-br', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

const Header: React.FC = () => {
  const { user, logout, updateUserSettings } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLanguagePopup, setShowLanguagePopup] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    playSound('click');
    try {
      const { data } = await userAPI.updateSettings({ language: languageCode });
      await updateUserSettings(data.settings);
      setShowLanguagePopup(false);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  const toggleLanguagePopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    setShowLanguagePopup(!showLanguagePopup);
  };

  const handleLogout = async () => {
    playSound('click');
    await logout();
    navigate('/login');
  };

  const toggleDropdown = () => {
    playSound('click');
    setShowDropdown(!showDropdown);
  };

  const handleNavigate = (path: string) => {
    playSound('click');
    navigate(path);
    setShowDropdown(false);
  };

  return (
    <header className="bg-background-light py-3 px-4 shadow-md sticky top-0 z-30">
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0" onClick={() => playSound('click')}>
          <img
            src="https://i.imgur.com/LwEBPqO.jpeg"
            alt="Horizon 777"
            className="h-8 w-8 md:h-10 md:w-10 rounded-lg object-cover"
          />
        </Link>

        {/* Balance */}
        <div className="flex items-center space-x-2 bg-background-lighter px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base">
          <span className="text-text-muted">Saldo:</span>
          <span className="text-secondary font-bold">
            R$ {(user?.balance || 0).toFixed(2)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => handleNavigate('/deposit')}
            className="btn-action text-xs sm:text-sm md:text-base px-2 sm:px-4"
          >
            Depositar
          </button>

          <div className="relative">
            <button 
              onClick={toggleDropdown}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary-light transition-colors"
              aria-label="Menu do usuário"
            >
              <User size={20} />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background-light border border-background-lighter overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-background-lighter">
                    <p className="font-medium text-text truncate">{user?.username}</p>
                  </div>

                  <div className="py-1">
                    <button 
                      onClick={() => handleNavigate('/deposit')}
                      className="flex items-center w-full px-4 py-2 text-sm text-text hover:bg-primary/20"
                    >
                      <Wallet size={16} className="mr-2" />
                      Depositar
                    </button>
                    <button 
                      onClick={() => handleNavigate('/withdraw')}
                      className="flex items-center w-full px-4 py-2 text-sm text-text hover:bg-primary/20"
                    >
                      <Wallet size={16} className="mr-2" />
                      Sacar
                    </button>
                    <button 
                      onClick={toggleLanguagePopup}
                      className="relative flex items-center w-full px-4 py-2 text-sm text-text hover:bg-primary/20"
                    >
                      <Languages size={16} className="mr-2" />
                      Idioma
                      <ChevronDown size={14} className="ml-auto" />
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-text hover:bg-primary/20"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sair
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Language Selection Popup */}
      <AnimatePresence>
        {showLanguagePopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-background-light rounded-lg p-6 max-w-md w-full shadow-xl relative overflow-hidden"
            >
              {/* Purple gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-action to-primary" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Languages size={24} className="text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Selecione seu idioma</h3>
                    <p className="text-text-muted text-sm">Choose your language</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLanguagePopup(false)}
                  className="text-text-muted hover:text-text p-1 rounded-full hover:bg-background-lighter"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex items-center p-4 rounded-lg transition-all ${
                      user?.settings?.language === lang.code
                        ? 'bg-action/20 border-2 border-action'
                        : 'bg-background-lighter hover:bg-background border-2 border-transparent'
                    }`}
                  >
                    <span className="text-2xl mr-3">{lang.flag}</span>
                    <div className="flex-1">
                      <p className="font-medium">{lang.name}</p>
                    </div>
                    {user?.settings?.language === lang.code && (
                      <Check className="text-action" size={20} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;