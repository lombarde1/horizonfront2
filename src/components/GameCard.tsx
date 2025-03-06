import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../contexts/SoundContext';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, X, ArrowRight } from 'lucide-react';

interface GameCardProps {
  id: string;
  name: string;
  imageUrl?: string;
  category: string;
}

const GameCard: React.FC<GameCardProps> = ({ id, name, imageUrl, category }) => {
  const navigate = useNavigate();
  const { playSound } = useSound();
  const { user } = useAuth();
  const [showPopup, setShowPopup] = React.useState(false);

  const handleClick = () => {
    playSound('click');
    if (name === "Dino Rex" || id === "horizon777-dino-rex") {
      navigate('/game/horizon777-dino-rex');
    } else {
      setShowPopup(true);
    }
  };

  const handleDeposit = () => {
    playSound('click');
    navigate('/deposit');
  };

  const handleClosePopup = () => {
    playSound('click');
    setShowPopup(false);
  };

  const handleMouseEnter = () => {
    playSound('hover');
  };

  return (
    <>
      <motion.div
        whileHover={{ 
          scale: 1.05,
          boxShadow: '0 0 15px rgba(121, 40, 202, 0.5)'
        }}
        whileTap={{ scale: 0.98 }}
        className="game-card"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
      >
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={imageUrl || 'https://i.imgur.com/placeholder.png'} 
            alt={name} 
            className="w-full h-40 object-cover transition-transform duration-300 hover:scale-110"
          />
          <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded-full text-xs text-white">
            {category}
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-text truncate">{name}</h3>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPopup && (
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
                    <Wallet size={24} className="text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Faça seu primeiro depósito</h3>
                    <p className="text-text-muted text-sm">Para começar a jogar {name}</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="text-text-muted hover:text-text p-1 rounded-full hover:bg-background-lighter"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-background-lighter p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-muted">Depósito mínimo</span>
                    <span className="text-secondary font-bold">R$ 30,00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Método</span>
                    <span className="text-text">Pix</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-text-muted">Processamento</span>
                    <span className="text-green-500">Instantâneo</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDeposit}
                className="w-full btn-action py-3 font-semibold flex items-center justify-center"
              >
                Fazer Depósito
                <ArrowRight size={20} className="ml-2" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GameCard;