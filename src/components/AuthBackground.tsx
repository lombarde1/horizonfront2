import React from 'react';
import Banner from './Banner';
import GameCard from './GameCard';
import { Wallet, User } from 'lucide-react';

const sampleGames = [
  {
    id: '1',
    name: 'Fortune Tiger',
    thumbnailUrl: 'https://i.imgur.com/lCMY74B.png',
    category: 'Slots'
  },
  {
    id: '2',
    name: 'Fortune Mouse',
    thumbnailUrl: 'https://i.imgur.com/NDp35jD.png',
    category: 'Slots'
  },
  {
    id: '3',
    name: 'Fortune Ox',
    thumbnailUrl: 'https://i.imgur.com/uWYQEcx.png',
    category: 'Slots'
  }
];

const AuthBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/90">
        <div className="opacity-60">
          {/* Header Preview */}
          <header className="bg-background-light py-3 px-4 shadow-md mb-6">
            <div className="container-custom flex items-center justify-between">
              <img 
                src="https://i.imgur.com/8JoHo9g.png" 
                alt="Horizon 777" 
                className="h-10 md:h-12"
              />
              
              <div className="hidden md:flex items-center space-x-2 bg-background-lighter px-4 py-2 rounded-full">
                <span className="text-text-muted">Banco:</span>
                <span className="text-secondary font-bold">R$ 1.000,00</span>
              </div>

              <div className="flex items-center space-x-3">
                <button className="btn-action text-sm md:text-base">
                  Depositar
                </button>
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                  <User size={20} />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent h-32 z-10" />
            <Banner />
            <div className="container-custom">
              <h2 className="text-2xl font-bold mb-4 neon-text">Jogos em Destaque</h2>
              <div className="grid grid-cols-3 gap-4">
                {sampleGames.map(game => (
                  <GameCard key={game.id} {...game} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional blur layer */}
      <div className="absolute inset-0 backdrop-blur-sm" />
      
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background/30" />
    </div>
  );
};

export default AuthBackground;