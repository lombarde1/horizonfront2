import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gamesAPI, bonusAPI, userAPI } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Banner from '../components/Banner';
import GameCard from '../components/GameCard';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';
import { Gift, X, Wallet, ArrowRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Game {
  name: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  provider: string;
}

const generateGameKey = (game: Game) => `${game.provider}-${game.name}`.toLowerCase().replace(/\s+/g, '-');

const Home: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [showDepositPopup, setShowDepositPopup] = useState(false);
  const [showBonusClaimedPopup, setShowBonusClaimedPopup] = useState(false);
  const { user, fetchProfile } = useAuth();
  const navigate = useNavigate();

  // Fetch profile only once when component mounts
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleDeposit = () => {
    setShowDepositPopup(false);
    navigate('/deposit');
  };

  const handleClaimBonus = async () => {
    try {
      setClaimingBonus(true);
      await bonusAPI.claimBonus();
      setShowBonusPopup(false);
    } catch (error) {
      if (error.response?.data?.message === 'Bonus already claimed') {
        setShowBonusClaimedPopup(true);
      } else if (error.response?.data?.message === 'No balance available to apply bonus') {
        setShowDepositPopup(true);
      }
      console.error('Error claiming bonus:', error);
    } finally {
      setClaimingBonus(false);
    }
  };

  const navigateToAdmin = () => {
    navigate('/admin');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [gamesRes, featuredRes, categoriesRes] = await Promise.all([
          gamesAPI.getAllGames(),
          gamesAPI.getFeaturedGames(),
          gamesAPI.getGameCategories()
        ]);
        
        // Filter out any games with missing required data
        const validGames = gamesRes.data.filter(game => game.name && game.imageUrl);
        const validFeaturedGames = featuredRes.data.filter(game => game.name && game.imageUrl);
        
        setGames(validGames);
        setFeaturedGames(validFeaturedGames);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredGames = selectedCategory === 'all' 
    ? games 
    : games.filter(game => game.category === selectedCategory);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Arabic Language Bonus Popup */}
      {user?.settings?.language === 'ar' && (
        <div className="bg-action/10 border-t border-b border-action/20">
          <div className="container-custom py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-action/20 flex items-center justify-center mr-4">
                  <Gift size={20} className="text-action" />
                </div>
                <p className="text-white font-medium">
                  Bienvenido em su primer depósito recibirá uno bono gratuito de 400 ayunes
                </p>
              </div>
              <button
                onClick={handleClaimBonus}
                disabled={claimingBonus}
                className={`btn-action px-6 py-2 ${claimingBonus ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {claimingBonus ? 'Procesando...' : 'Rescatar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-grow container-custom py-6">
        <Banner />
        
        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 neon-text">Jogos em Destaque</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featuredGames.map(game => (
                <GameCard 
                  key={`featured-${generateGameKey(game)}`}
                  id={generateGameKey(game)}
                  name={game.name}
                  imageUrl={game.imageUrl}
                  category={game.category}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Game Categories */}
        <section id="all-games" className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold neon-text">Todos os Jogos</h2>
            
            <div className="flex overflow-x-auto pb-2 space-x-2 hide-scrollbar">
              <button
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === 'all' 
                    ? 'bg-action text-white' 
                    : 'bg-background-lighter text-text-muted hover:bg-background-light'
                }`}
                onClick={() => setSelectedCategory('all')}
              >
                Todos
              </button>
              
              {categories.map(category => (
                <button
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === category 
                      ? 'bg-action text-white' 
                      : 'bg-background-lighter text-text-muted hover:bg-background-light'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filteredGames.map(game => (
              <GameCard 
                key={`all-${generateGameKey(game)}`}
                id={generateGameKey(game)}
                name={game.name}
                imageUrl={game.imageUrl}
                category={game.category}
              />
            ))}
          </motion.div>
          
          {filteredGames.length === 0 && (
            <div className="text-center py-10">
              <p className="text-text-muted">Nenhum jogo encontrado nesta categoria.</p>
            </div>
          )}
        </section>
      </main>
      
      <Footer />
      
      {/* Botão discreto para Admin - mais visível, mas ainda sutil */}
      <div className="fixed bottom-4 right-4 z-30">
        <button 
          onClick={navigateToAdmin}
          className="w-8 h-8 bg-background-light opacity-20 hover:opacity-60 rounded-full flex items-center justify-center transition-opacity shadow-md"
          aria-label="Admin"
        >
          <Settings size={14} className="text-text-muted" />
        </button>
      </div>
      
      {/* Bonus Already Claimed Popup */}
      <AnimatePresence>
        {showBonusClaimedPopup && (
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
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Gift size={24} className="text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Bônus Indisponível</h3>
                    <p className="text-text-muted text-sm">Você já resgatou seu bônus</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBonusClaimedPopup(false)}
                  className="text-text-muted hover:text-text p-1 rounded-full hover:bg-background-lighter"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-text-muted mb-6">
                O bônus de boas-vindas só pode ser resgatado uma vez por usuário.
              </p>
              
              <button
                onClick={() => setShowBonusClaimedPopup(false)}
                className="w-full btn-action py-3 font-semibold"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Deposit Required Popup */}
      <AnimatePresence>
        {showDepositPopup && (
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
                    <p className="text-text-muted text-sm">Para resgatar seu bônus</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDepositPopup(false)}
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
                    <span className="text-text">PIX</span>
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
    </div>
  );
};

export default Home;