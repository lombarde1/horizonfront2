import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Info } from 'lucide-react';
import { gamesAPI } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { useSound } from '../contexts/SoundContext';

interface GameDetails {
  _id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  description: string;
  minBet: number;
  maxBet: number;
  rules?: string;
  isActive: boolean;
}

const GameDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);
  const navigate = useNavigate();
  const { playSound } = useSound();

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data } = await gamesAPI.getGameDetails(id);
        setGame(data);
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Não foi possível carregar os detalhes do jogo. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [id]);

  const handleBack = () => {
    playSound('click');
    navigate(-1);
  };

  const toggleRules = () => {
    playSound('click');
    setShowRules(!showRules);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !game) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container-custom py-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-text">Oops!</h2>
            <p className="text-text-muted mb-6">{error || 'Jogo não encontrado'}</p>
            <button onClick={handleBack} className="btn-primary">
              Voltar
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container-custom py-6">
        <button
          onClick={handleBack}
          className="flex items-center text-text-muted hover:text-text mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar
        </button>
        
        <div className="bg-background-light rounded-lg overflow-hidden">
          <div className="relative h-[200px] md:h-[300px]">
            <img 
              src={game.thumbnailUrl} 
              alt={game.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background-light to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <div className="inline-block bg-primary px-3 py-1 rounded-full text-sm mb-2">
                {game.category}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{game.name}</h1>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="bg-background-lighter px-4 py-2 rounded-lg">
                <span className="text-text-muted text-sm">Aposta mínima</span>
                <p className="text-secondary font-bold">R$ {game.minBet}</p>
              </div>
              <div className="bg-background-lighter px-4 py-2 rounded-lg">
                <span className="text-text-muted text-sm">Aposta máxima</span>
                <p className="text-secondary font-bold">R$ {game.maxBet}</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3">Descrição</h2>
              <p className="text-text-muted">{game.description}</p>
            </div>
            
            {game.rules && (
              <div className="mb-8">
                <button
                  onClick={toggleRules}
                  className="flex items-center text-primary hover:text-primary-light"
                >
                  <Info size={20} className="mr-2" />
                  {showRules ? 'Ocultar regras' : 'Ver regras do jogo'}
                </button>
                
                {showRules && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 bg-background-lighter p-4 rounded-lg"
                  >
                    <h3 className="font-bold mb-2">Regras do Jogo</h3>
                    <p className="text-text-muted whitespace-pre-line">{game.rules}</p>
                  </motion.div>
                )}
              </div>
            )}
            
            <div className="flex justify-center">
              <button className="btn-action py-3 px-8 font-bold">
                Jogar Agora
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GameDetails;