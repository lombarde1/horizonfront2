import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';

const NotFound: React.FC = () => {
  const { playSound } = useSound();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mb-6">
          <img 
            src="https://i.imgur.com/9y5Abyh.jpeg" 
            alt="Horizon 777 Logo" 
            className="w-24 h-24 mx-auto"
          />
        </div>
        
        <h1 className="text-4xl font-bold mb-2 neon-text">404</h1>
        <h2 className="text-2xl font-bold mb-6 text-text">Página não encontrada</h2>
        
        <p className="text-text-muted mb-8 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        
        <Link 
          to="/" 
          className="btn-action inline-flex items-center py-3 px-6"
          onClick={() => playSound('click')}
        >
          <Home size={20} className="mr-2" />
          Voltar para o Início
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;