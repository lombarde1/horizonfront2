import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSound } from '../contexts/SoundContext';
import { useNavigate } from 'react-router-dom';

const Banner: React.FC = () => {
  const { sounds, playSound } = useSound();
  const [jackpotValue, setJackpotValue] = useState(10000);
  const jackpotRef = useRef<HTMLDivElement>(null);
  const coinSoundRef = useRef<boolean>(false);
  const navigate = useNavigate();

  const scrollToGames = () => {
    playSound('click');
    const gamesSection = document.querySelector('#all-games');
    if (gamesSection) {
      gamesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Increment jackpot value over time
    const interval = setInterval(() => {
      setJackpotValue(prev => prev + Math.floor(Math.random() * 10) + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleJackpotHover = () => {
    if (!coinSoundRef.current && sounds.coins) {
      sounds.coins.play();
      coinSoundRef.current = true;
    }
  };

  const handleJackpotLeave = () => {
    if (coinSoundRef.current && sounds.coins) {
      sounds.coins.stop();
      coinSoundRef.current = false;
    }
  };

  return (
    <div className="mb-8">
      {/* Main Banner */}
      <div className="mb-4 max-w-5xl mx-auto">
        <div 
          className="relative h-[140px] sm:h-[180px] md:h-[220px] rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-[1.02]"
          onClick={scrollToGames}
        >
          <img 
            src="https://winnerx1.site/public/uploads/36902022025212608.jpg" 
            alt="Horizon 777 Promotion" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Jackpot Banner */}
      <div className="mb-4 max-w-5xl mx-auto">
        <div 
          className="relative h-[120px] sm:h-[160px] md:h-[200px] rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-[1.02]"
          onClick={scrollToGames}
          onMouseEnter={handleJackpotHover}
          onMouseLeave={handleJackpotLeave}
        >
          <img 
            src="https://i.imgur.com/knTikCU.png" 
            alt="Jackpot Banner" 
            className="w-full h-full object-cover"
          />
          <div 
            ref={jackpotRef}
            className="absolute"
            style={{ top: '55%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              {/* Text shadow background for extra glow effect */}
              <div 
                className="absolute inset-0 blur-md opacity-70"
                style={{ color: '#FFC107', transform: 'scale(1.05)' }}
              >
                R$ {jackpotValue.toLocaleString('pt-BR')}
              </div>
              
              {/* Main text with gradient */}
              <div 
                className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl relative"
                style={{
                  background: 'linear-gradient(to bottom, #FFEB3B 0%, #FFC107 50%, #FF9800 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: `
                    0 0 5px rgba(255, 193, 7, 0.8),
                    0 0 10px rgba(255, 193, 7, 0.5),
                    0 0 15px rgba(255, 193, 7, 0.3),
                    0 0 20px rgba(255, 152, 0, 0.3)
                  `,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 800
                }}
              >
                R$ {jackpotValue.toLocaleString('pt-BR')}
              </div>
              
              {/* Subtle white outline for better contrast */}
              <div 
                className="absolute inset-0 text-transparent font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                style={{
                  WebkitTextStroke: '1px rgba(255, 255, 255, 0.3)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 800
                }}
              >
                R$ {jackpotValue.toLocaleString('pt-BR')}
              </div>
            </motion.div>
            
            {/* Animated numbers effect */}
            <div className="overflow-hidden h-4 sm:h-6 md:h-8 absolute -z-10 opacity-30">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -100] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    ease: "linear",
                    delay: i * 0.05
                  }}
                  className="text-amber-400 font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                >
                  {Math.floor(Math.random() * 10)}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Banners in Two Columns */}
      <div className="grid grid-cols-2 gap-4 mt-4 max-w-4xl mx-auto">
        <div 
          className="rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-[1.02]"
          onClick={scrollToGames}
        >
          <img 
            src="https://winnerx1.site/public/uploads/banner1sub1.webp" 
            alt="Promotion 1" 
            className="w-full h-[80px] sm:h-[100px] md:h-[120px] object-cover"
          />
        </div>
        <div 
          className="rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-[1.02]"
          onClick={scrollToGames}
        >
          <img 
            src="https://winnerx1.site/public/uploads/banner2sub2.webp" 
            alt="Promotion 2" 
            className="w-full h-[80px] sm:h-[100px] md:h-[120px] object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Banner;