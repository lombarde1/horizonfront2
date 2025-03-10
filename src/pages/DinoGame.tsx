import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Coins, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Interface para o estado do jogo
interface GameState {
  _id: string;
  userId?: string;
  status: 'active' | 'ended';
  score: number;
  speed: number;
  earnedAmount: number;
  startTime?: string;
  lastUpdateTime?: string;
  endTime?: string;
}

// Constantes de física do jogo - ajustadas para melhor jogabilidade
const GROUND_HEIGHT = 50;
const JUMP_FORCE = -16; 
const GRAVITY = 0.7;
const INITIAL_SPEED = 5;
const SPAWN_INTERVAL_BASE = 1800;
const SPAWN_INTERVAL_MIN = 600;
const CACTUS_HEIGHT_RANGE = { min: 30, max: 60 };
const CACTUS_WIDTH_RANGE = { min: 15, max: 30 };

// Constantes para animações
const RUNNING_FRAME_RATE = 120;
const PARALLAX_SPEEDS = {
  stars: 0.1,
  mountains: 0.3,
  ground: 1.0
};

// Tipos de obstáculos
type ObstacleType = 'cactus' | 'bird';

// Interface para obstáculos
interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  variant: number;
  passed?: boolean; // Adicionar flag para rastrear se o obstáculo já foi passado
}

// Partículas para efeitos visuais
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

const DinoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  const [dinoY, setDinoY] = useState(0);
  const velocityRef = useRef(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [dinoFrame, setDinoFrame] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [finalEarnings, setFinalEarnings] = useState(0);
  const [deathFrame, setDeathFrame] = useState(0);
  const [gameOutcome, setGameOutcome] = useState<'victory' | 'defeat' | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [backgroundOffset, setBackgroundOffset] = useState({ stars: 0, mountains: 0, ground: 0 });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(INITIAL_SPEED);
  const animationFrameRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);
  const lastObstaclePassedRef = useRef<number>(-1);
  const lastFrameTimeRef = useRef<number>(0);
  const jumpSoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fpsRef = useRef<number[]>([]);
  const [fps, setFps] = useState(0);
  const imageRefs = useRef<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { playSound } = useSound();

  // Carregar imagens
  useEffect(() => {
    const imageSources = {
      dinoRun1: 'https://i.imgur.com/5dKGp3n.png',
      dinoRun2: 'https://i.imgur.com/tNtvjbh.png',
      dinoRun3: 'https://i.imgur.com/aIT6O75.png',
      dinoDuck1: 'https://i.imgur.com/jbGrnTD.png',
      dinoDuck2: 'https://i.imgur.com/6oWlN61.png',
      dinoJump: 'https://i.imgur.com/kU0K464.png',
      dinoDead1: 'https://i.imgur.com/6Owt92I.png',
      dinoDead2: 'https://i.imgur.com/zPAaJUB.png',
      cactusSmall: 'https://images.vexels.com/media/users/3/157784/isolated/preview/bf2d571488a39e11419799c2a29a010d-cacto-fofo.png',
      cactusTall: 'https://cdn.pixabay.com/photo/2020/07/06/07/35/cactus-5375863_960_720.png',
      cactusMultiple: 'https://static.vecteezy.com/system/resources/thumbnails/014/374/576/small_2x/traffic-cone-illustration-in-3d-isometric-style-png.png',
      bird1: 'https://img.poki-cdn.com/cdn-cgi/image/quality=78,width=1200,height=1200,fit=cover,f=png/5e0df231478aa0a331a4718d09dd91a2.png',
      bird2: 'https://wallpapers.com/images/hd/flappy-bird-character-illustration-tfhwubtt9cxlsebo.png',
      cloud: 'https://i.pinimg.com/originals/8f/6e/65/8f6e6534617dcdc81ace386e4b6905a1.png',
    };
    
    // Função para carregar todas as imagens
    const loadImages = async () => {
      const imagePromises = Object.entries(imageSources).map(([key, source]) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = source;
          img.onload = () => {
            imageRefs.current[key] = img;
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load image: ${source}`);
            resolve(); // Resolve anyway to prevent blocking
          };
        });
      });
      
      await Promise.all(imagePromises);
      setImagesLoaded(true);
    };
    
    loadImages();
  }, []);

  // Criar partículas de poeira
  const createDustParticles = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dinoX = 50;
    const dinoSize = Math.min(60, canvas.height * 0.15);
    const groundY = canvas.height - GROUND_HEIGHT;
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < 10; i++) {
      newParticles.push({
        x: dinoX + Math.random() * dinoSize * 0.5,
        y: groundY + Math.random() * 10 - 5,
        vx: -Math.random() * 2 - 1,
        vy: -Math.random() * 2 - 1,
        size: Math.random() * 3 + 1,
        life: 1,
        maxLife: 1,
        color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Criar partículas de explosão ao colidir
  const createCollisionParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        life: 1,
        maxLife: 1,
        color: `rgba(255, ${Math.random() * 100 + 100}, 0, ${Math.random() * 0.5 + 0.5})`
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Função para registrar um pulo bem-sucedido (passar por um obstáculo sem colidir)
  const handleSuccessfulObstaclePass = useCallback(async (obstacleIndex: number) => {
    if (!gameState || gameOver || isDead) return;
    
    // Incrementar o combo e exibir
    setCombo(prev => prev + 1);
    setShowCombo(true);
    setTimeout(() => setShowCombo(false), 1000);
    
    // Som de passagem bem-sucedida
    playSound('point');
    
    try {
      // Chamar a API para registrar o pulo
      const response = await fetch(`https://horizon777api-production.up.railway.app/api/dino/${gameState._id}/jump`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error registering jump:', errorData.message);
        return;
      }
      
      const data = await response.json();
      
      // Atualizar o estado do jogo com a resposta da API
      setGameState(data);
      setScore(data.score);
      
      // Atualizar a velocidade do jogo com base na resposta da API
      setCurrentSpeed(INITIAL_SPEED * data.speed);
      
      console.log('Obstacle passed successfully, API called!');
    } catch (error) {
      console.error('Error registering jump:', error);
    }
  }, [gameState, gameOver, isDead, playSound]);

  // Verificar colisão com obstáculos
  const checkCollision = useCallback((dinoX: number, dinoY: number, dinoHeight: number, obstacle: Obstacle, obstacleIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const dinoWidth = isDucking ? 80 : 60;
    const actualDinoHeight = isDucking ? dinoHeight * 0.6 : dinoHeight;
    
    // Ajuste para hitbox mais precisa (20% menor que o sprite visível)
    const hitboxReducer = 0.2;
    const hitboxX = dinoX + dinoWidth * hitboxReducer / 2;
    const hitboxWidth = dinoWidth * (1 - hitboxReducer);
    const hitboxY = canvas.height - GROUND_HEIGHT - actualDinoHeight + dinoY;
    const hitboxHeight = actualDinoHeight * (1 - hitboxReducer);

    // Ajuste para hitbox do obstáculo (10% menor)
    const obstacleHitboxReducer = 0.1;
    const obstacleHitboxX = obstacle.x + obstacle.width * obstacleHitboxReducer / 2;
    const obstacleHitboxWidth = obstacle.width * (1 - obstacleHitboxReducer);
    const obstacleHitboxHeight = obstacle.height * (1 - obstacleHitboxReducer);
    const obstacleHitboxY = canvas.height - GROUND_HEIGHT - obstacleHitboxHeight;

    // Verificar se o obstáculo foi passado sem colisão
    if (obstacle.x + obstacle.width < dinoX - 10) { // Adicionamos uma pequena margem para evitar múltiplas detecções
      // Só considerar se o obstáculo ainda não foi contabilizado
      if (obstacle.x + obstacle.width > 0 && !obstacles[obstacleIndex].passed) {
        // Marcar este obstáculo como já passado
        setObstacles(prev => prev.map((obs, idx) => 
          idx === obstacleIndex ? { ...obs, passed: true } : obs
        ));
        
        // Chamar função para registrar o pulo bem-sucedido
        handleSuccessfulObstaclePass(obstacleIndex);
      }
      
      return false;
    }

    // Verificar colisão entre as hitboxes
    const collision = (
      hitboxX < obstacleHitboxX + obstacleHitboxWidth &&
      hitboxX + hitboxWidth > obstacleHitboxX &&
      hitboxY < obstacleHitboxY + obstacleHitboxHeight &&
      hitboxY + hitboxHeight > obstacleHitboxY
    );
    
    return collision;
  }, [isDucking, obstacles, handleSuccessfulObstaclePass]);

  // Finalizar o jogo
  const endGame = useCallback(async () => {
    if (gameState && !gameOver) {
      // Play collision sound
      playSound('hit');
      
      try {
        // Chamar a API para finalizar o jogo
        const response = await fetch(`https://horizon777api-production.up.railway.app/api/dino/${gameState._id}/end`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao finalizar o jogo');
        }
        
        const data = await response.json();
        setGameState({...data, status: 'ended'});
        
        // Determine game outcome and set final earnings
        const isVictory = data.score >= 100;
        setGameOutcome(isVictory ? 'victory' : 'defeat');
        
        if (isVictory) {
          setFinalEarnings(data.earnedAmount);
          
          // Timeout to ensure hit sound plays first
          setTimeout(() => {
            playSound('win');
          }, 500);
        } else {
          setFinalEarnings(data.earnedAmount * 0.5);
        }
        
        // Update user balance
        if (data.user) {
          updateUser(data.user);
        }
        
        setGameOver(true);
        setIsDead(true);
        
        // Create explosion particles at dino position
        if (canvasRef.current) {
          const dinoX = 50;
          const dinoY = canvasRef.current.height - GROUND_HEIGHT - 30;
          createCollisionParticles(dinoX, dinoY);
        }
        
        setTimeout(() => {
          setShowGameOver(true);
        }, 1500);
      } catch (error) {
        console.error('Error ending game:', error);
      }
    }
  }, [gameState, gameOver, playSound, updateUser, createCollisionParticles]);

  // Função de pulo aprimorada
  const handleJump = useCallback(() => {
    if (!isJumping && !isDucking && !gameOver && gameState && !isPaused) {
      setIsJumping(true);
      velocityRef.current = JUMP_FORCE;
      
      // Adicionar partículas de poeira no pulo
      createDustParticles();
      
      // Tocar som de pulo
      playSound('jump');
    }
  }, [isJumping, isDucking, gameOver, gameState, isPaused, playSound, createDustParticles]);

  // Função de agachamento
  const handleDuck = useCallback((isDucking: boolean) => {
    if (!isJumping && !gameOver && gameState && !isPaused) {
      setIsDucking(isDucking);
      
      if (isDucking) {
        // Adicionar partículas de poeira ao agachar
        createDustParticles();
      }
    }
  }, [isJumping, gameOver, gameState, isPaused, createDustParticles]);

  // Iniciar jogo
  const startGame = useCallback(async () => {
    try {
      // Exibir contagem regressiva
      for (let i = 3; i > 0; i--) {
        setCountdownValue(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setCountdownValue(null);
      
      // Chamar a API para iniciar um novo jogo
      const response = await fetch('https://horizon777api-production.up.railway.app/api/dino/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao iniciar o jogo');
      }
      
      const data = await response.json();
      setGameState(data);
      setGameOver(false);
      setShowGameOver(false);
      setIsDead(false);
      setDeathFrame(0);
      setDinoY(0);
      setScore(data.score);
      setCombo(0);
      setShowCombo(false);
      setIsPaused(false);
      velocityRef.current = 0;
      lastSpawnTimeRef.current = 0;
      lastObstaclePassedRef.current = -1;
      setObstacles([]);
      setParticles([]);
      setBackgroundOffset({ stars: 0, mountains: 0, ground: 0 });
      setCurrentSpeed(INITIAL_SPEED * data.speed);
      
      // Play start sound
      playSound('start');
    } catch (error) {
      console.error('Error starting game:', error);
      if (error instanceof Error && error.message === 'Insufficient balance to start a game') {
        navigate('/deposit');
      }
    }
  }, [navigate, playSound]);

  // Pausar o jogo
  const togglePause = useCallback(() => {
    if (gameState && !gameOver && !isDead) {
      setIsPaused(prev => !prev);
    }
  }, [gameState, gameOver, isDead]);

  // Redimensionar o canvas
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Get viewport dimensions
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    
    // Base dimensions
    let baseWidth = 800;
    let baseHeight = 400;
    
    // For mobile devices
    if (vw < 768) {
      baseWidth = vw - 32;
      baseHeight = baseWidth * 0.5625;
      
      if (baseHeight < 200) {
        baseHeight = 200;
        baseWidth = baseHeight * 1.777;
      }
    } else {
      baseWidth = Math.min(800, vw - 32);
      baseHeight = baseWidth / 2;
    }
    
    setCanvasSize({ width: baseWidth, height: baseHeight });
  }, []);

  // Loop principal do jogo
  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current || !imagesLoaded || isPaused) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calcular delta time para animações suaves
    const deltaTime = timestamp - (lastFrameTimeRef.current || timestamp);
    lastFrameTimeRef.current = timestamp;
    
    // Calcular FPS
    fpsRef.current.push(1000 / deltaTime);
    if (fpsRef.current.length > 60) {
      fpsRef.current.shift();
    }
    if (timestamp % 500 < 16) {
      setFps(Math.round(
        fpsRef.current.reduce((sum, value) => sum + value, 0) / fpsRef.current.length
      ));
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Atualizar e desenhar estrelas com parallax
    const starsOffset = backgroundOffset.stars;
    setBackgroundOffset(prev => ({
      ...prev,
      stars: (prev.stars + deltaTime * 0.01 * PARALLAX_SPEEDS.stars) % canvas.width
    }));
    
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(i * 523.3) * canvas.width + starsOffset * PARALLAX_SPEEDS.stars) % canvas.width;
      const y = (Math.cos(i * 327.7) * (canvas.height - GROUND_HEIGHT));
      const size = (Math.sin(timestamp * 0.001 + i) + 1) * 0.8 + 0.4; // Tamanho pulsante
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Configuração do parallax para o fundo
    const mountainsOffset = backgroundOffset.mountains;
    setBackgroundOffset(prev => ({
      ...prev,
      mountains: (prev.mountains + deltaTime * 0.05 * PARALLAX_SPEEDS.mountains) % canvas.width
    }));
    
    // Removemos a renderização das montanhas conforme solicitado

    // Desenhar nuvens
    if (imageRefs.current.cloud) {
      const cloudImg = imageRefs.current.cloud;
      // Adicionar várias nuvens em posições semi-aleatórias
      const cloudPositions = [
        { x: (timestamp * 0.02) % (canvas.width * 2) - canvas.width * 0.5, y: canvas.height * 0.15, size: 0.15 },
        { x: (timestamp * 0.015 + 300) % (canvas.width * 2) - canvas.width * 0.2, y: canvas.height * 0.25, size: 0.12 },
        { x: (timestamp * 0.01 + 600) % (canvas.width * 2) - canvas.width * 0.8, y: canvas.height * 0.1, size: 0.08 }
      ];
      
      cloudPositions.forEach(cloud => {
        const cloudSize = canvas.width * cloud.size;
        ctx.globalAlpha = 0.7;
        ctx.drawImage(cloudImg, cloud.x, cloud.y, cloudSize, cloudSize * 0.6);
      });
      ctx.globalAlpha = 1.0;
    }

    // Draw ground with parallax
    const groundOffset = backgroundOffset.ground;
    setBackgroundOffset(prev => ({
      ...prev,
      ground: (prev.ground + deltaTime * 0.1 * PARALLAX_SPEEDS.ground) % (canvas.width / 4)
    }));
    
    // Ground gradient
    const groundGradient = ctx.createLinearGradient(0, canvas.height - GROUND_HEIGHT, 0, canvas.height);
    groundGradient.addColorStop(0, '#2a3f5f');
    groundGradient.addColorStop(1, '#1c2e4a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
    
    // Ground details (linhas)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - GROUND_HEIGHT + 1);
    ctx.lineTo(canvas.width, canvas.height - GROUND_HEIGHT + 1);
    ctx.stroke();
    
    // Padrão pontilhado no chão
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < canvas.width / 20; i++) {
      const dotX = ((i * 20) - groundOffset * PARALLAX_SPEEDS.ground) % canvas.width;
      ctx.beginPath();
      ctx.arc(dotX, canvas.height - GROUND_HEIGHT / 2, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Atualizar posição do dino
    if (!isDead) {
      velocityRef.current += GRAVITY * (deltaTime / 16); // Normalizar para 60fps
      setDinoY(prev => {
        const newY = prev + velocityRef.current * (deltaTime / 16);
        if (newY >= 0) {
          setIsJumping(false);
          return 0;
        }
        return newY;
      });
    }

    // Desenhar dino
    const dinoX = 50;
    const dinoSize = Math.min(60, canvas.height * 0.15);
    const dinoPositionY = canvas.height - GROUND_HEIGHT - (isDucking ? dinoSize * 0.6 : dinoSize) + dinoY;
    
    if (!isDead) {
      let currentDinoImage;
      
      if (isJumping) {
        // Imagem de pulo
        currentDinoImage = imageRefs.current.dinoJump;
      } else if (isDucking) {
        // Animação de agachamento
        currentDinoImage = dinoFrame % 2 === 0 ? imageRefs.current.dinoDuck1 : imageRefs.current.dinoDuck2;
      } else {
        // Animação de corrida com 3 frames para mais fluidez
        if (dinoFrame === 0) currentDinoImage = imageRefs.current.dinoRun1;
        else if (dinoFrame === 1) currentDinoImage = imageRefs.current.dinoRun3; // Frame intermediário
        else currentDinoImage = imageRefs.current.dinoRun2;
      }
      
      if (currentDinoImage) {
        // Desenhar sombra
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(
          dinoX + dinoSize / 2, 
          canvas.height - GROUND_HEIGHT + 5, 
          dinoSize / 2, 
          dinoSize / 8, 
          0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Desenhar dino com tamanho adequado
        if (isDucking) {
          ctx.drawImage(
            currentDinoImage, 
            dinoX - dinoSize * 0.1, 
            dinoPositionY, 
            dinoSize * 1.2, 
            dinoSize * 0.6
          );
        } else {
          ctx.drawImage(currentDinoImage, dinoX, dinoPositionY, dinoSize, dinoSize);
        }
      }
      
      // Atualizar frame de animação com base no tempo para animação mais suave
      if (timestamp % RUNNING_FRAME_RATE < 16) {
        setDinoFrame(prev => (prev + 1) % 3);
      }
    } else {
      // Animação de morte
      const deathImage = deathFrame === 0 ? imageRefs.current.dinoDead1 : imageRefs.current.dinoDead2;
      
      if (deathImage) {
        // Desenhar sombra
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(
          dinoX + dinoSize / 2, 
          canvas.height - GROUND_HEIGHT + 5, 
          dinoSize / 2, 
          dinoSize / 8, 
          0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        ctx.drawImage(deathImage, dinoX, dinoPositionY, dinoSize, dinoSize);
      }
      
      // Animação de morte mais lenta
      if (timestamp % 300 < 16) {
        setDeathFrame(prev => (prev === 0 ? 1 : 0));
      }
    }

    // Atualizar e desenhar obstáculos
    if (!isDead && gameState) {
      // Calcular velocidade atual do jogo com base no estado do servidor
      const speedMultiplier = gameState.speed;
      
      // Spawn de obstáculos com intervalo adaptativo
      const timeSinceLastSpawn = timestamp - lastSpawnTimeRef.current;
      const adjustedInterval = Math.max(
        SPAWN_INTERVAL_MIN,
        SPAWN_INTERVAL_BASE - (score * 10)
      );
      
      if (timeSinceLastSpawn >= adjustedInterval) {
        lastSpawnTimeRef.current = timestamp;
        
        // Determinar tipo de obstáculo
        const obstacleType: ObstacleType = Math.random() > 0.7 && score > 20 ? 'bird' : 'cactus';
        
        // Variante do obstáculo para variedade visual
        const variant = Math.floor(Math.random() * 3);
        
        // Altura e largura aleatórias
        let height, width, y = 0;
        
        if (obstacleType === 'cactus') {
          height = Math.random() * (CACTUS_HEIGHT_RANGE.max - CACTUS_HEIGHT_RANGE.min) + CACTUS_HEIGHT_RANGE.min;
          width = Math.random() * (CACTUS_WIDTH_RANGE.max - CACTUS_WIDTH_RANGE.min) + CACTUS_WIDTH_RANGE.min;
        } else {
          // Pássaros aparecem em alturas variadas
          height = 30;
          width = 40;
          y = Math.random() > 0.5 ? -40 : -80; // Dois níveis de altura para os pássaros
        }
        
        setObstacles(prev => [...prev, {
          x: canvas.width,
          y,
          width,
          height,
          type: obstacleType,
          variant,
          passed: false // Inicializar como não passado
        }]);
      }

      // Atualizar posição dos obstáculos com a velocidade atual
      setObstacles(prev => prev
        .map(obstacle => ({
          ...obstacle,
          x: obstacle.x - currentSpeed * (deltaTime / 16)
        }))
        .filter(obstacle => obstacle.x > -obstacle.width)
      );
    }

    // Desenhar obstáculos
    obstacles.forEach((obstacle, index) => {
      let obstacleImage;
      
      // Selecionar imagem apropriada baseada no tipo e variante
      if (obstacle.type === 'cactus') {
        if (obstacle.variant === 0) obstacleImage = imageRefs.current.cactusSmall;
        else if (obstacle.variant === 1) obstacleImage = imageRefs.current.cactusTall;
        else obstacleImage = imageRefs.current.cactusMultiple;
      } else {
        // Animação de pássaro - virando a imagem horizontalmente
        obstacleImage = timestamp % 200 < 100 ? imageRefs.current.bird1 : imageRefs.current.bird2;
        
        // Virar o pássaro horizontalmente (pois as imagens originais estão viradas para a direita)
        if (obstacleImage) {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCanvas.width = obstacle.width;
            tempCanvas.height = obstacle.height;
            
            // Virar horizontalmente
            tempCtx.translate(obstacle.width, 0);
            tempCtx.scale(-1, 1);
            tempCtx.drawImage(obstacleImage, 0, 0, obstacle.width, obstacle.height);
            
            // Criar uma nova imagem com o resultado
            const flippedImg = new Image();
            flippedImg.src = tempCanvas.toDataURL();
            obstacleImage = flippedImg;
          }
        }
      }
      
      if (obstacleImage) {
        const obstacleY = canvas.height - GROUND_HEIGHT - obstacle.height + obstacle.y;
        
        // Desenhar sombra
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(
          obstacle.x + obstacle.width / 2, 
          canvas.height - GROUND_HEIGHT + 5, 
          obstacle.width / 2, 
          obstacle.height / 8, 
          0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Desenhar obstáculo
        ctx.drawImage(obstacleImage, obstacle.x, obstacleY, obstacle.width, obstacle.height);
      }
      
      // Verificar colisão
      if (checkCollision(dinoX, dinoY, dinoSize, obstacle, index) && !isDead) {
        createCollisionParticles(dinoX + dinoSize/2, dinoPositionY + dinoSize/2);
        endGame();
      }
    });

    // Atualizar e desenhar partículas
    setParticles(prev => prev
      .map(particle => {
        // Atualizar posição e vida da partícula
        return {
          ...particle,
          x: particle.x + particle.vx * (deltaTime / 16),
          y: particle.y + particle.vy * (deltaTime / 16),
          life: particle.life - 0.02 * (deltaTime / 16)
        };
      })
      .filter(particle => particle.life > 0)
    );
    
    // Desenhar partículas
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Efeito de vibração da câmera quando morre
    if (isDead) {
      const shakeAmount = Math.min(10, 10 * ((timestamp - lastFrameTimeRef.current) / 1000));
      if (shakeAmount > 0.5) {
        ctx.save();
        ctx.translate(
          Math.random() * shakeAmount - shakeAmount / 2,
          Math.random() * shakeAmount - shakeAmount / 2
        );
      }
    }

    // Interface do usuário
    // Desenhar barra de progresso
    const progressBarWidth = canvas.width - 40;
    const progressBarHeight = 6;
    const progressBarX = 20;
    const progressBarY = 20;
    
    // Fundo da barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 3);
    ctx.fill();
    
    // Progresso
    const progress = Math.min(1, score / 100);
    const fillWidth = progressBarWidth * progress;
    
    // Gradiente para a barra de progresso
    const progressGradient = ctx.createLinearGradient(progressBarX, 0, progressBarX + progressBarWidth, 0);
    progressGradient.addColorStop(0, '#4CAF50');
    progressGradient.addColorStop(0.5, '#FFC107');
    progressGradient.addColorStop(1, '#FF5722');
    
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(progressBarX, progressBarY, fillWidth, progressBarHeight, 3);
    ctx.fill();
    
    // Texto de progresso
    const fontSize = Math.max(14, Math.min(20, canvas.width * 0.025));
    ctx.font = `${fontSize}px Montserrat`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${score}/100`, canvas.width / 2, progressBarY + progressBarHeight + 15);
    ctx.shadowBlur = 0;

    // Desenhar ganhos
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${fontSize}px Montserrat`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(`R$ ${gameState?.earnedAmount.toFixed(2) || '0.00'}`, canvas.width - 20, 30);
    ctx.shadowBlur = 0;

    // Desenhar combo se visível
    if (showCombo && combo > 1) {
      const comboText = `Combo x${combo}`;
      ctx.textAlign = 'center';
      ctx.font = `bold ${fontSize * 1.2}px Montserrat`;
      
      // Calcular tamanho do texto para o fundo
      const textMetrics = ctx.measureText(comboText);
      const textWidth = textMetrics.width + 20;
      const textHeight = fontSize * 1.5;
      
      // Desenhar fundo com gradiente
      const comboGradient = ctx.createLinearGradient(
        canvas.width / 2 - textWidth / 2, 
        canvas.height / 3, 
        canvas.width / 2 + textWidth / 2, 
        canvas.height / 3
      );
      comboGradient.addColorStop(0, 'rgba(255, 193, 7, 0.7)');
      comboGradient.addColorStop(1, 'rgba(255, 87, 34, 0.7)');
      
      ctx.fillStyle = comboGradient;
      ctx.beginPath();
      ctx.roundRect(
        canvas.width / 2 - textWidth / 2, 
        canvas.height / 3 - textHeight / 2, 
        textWidth, 
        textHeight, 
        10
      );
      ctx.fill();
      
      // Desenhar texto
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(comboText, canvas.width / 2, canvas.height / 3 + fontSize / 3);
      ctx.shadowBlur = 0;
    }

    // Desenhar contagem regressiva
    if (countdownValue !== null) {
      // Fundo semi-transparente
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Texto da contagem
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${fontSize * 3}px Montserrat`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText(`${countdownValue}`, canvas.width / 2, canvas.height / 2);
      ctx.font = `${fontSize}px Montserrat`;
      ctx.fillText('Prepare-se...', canvas.width / 2, canvas.height / 2 + fontSize * 3);
      ctx.shadowBlur = 0;
    }

    // Restaurar contexto se tiver aplicado efeito de vibração
    if (isDead) {
      ctx.restore();
    }

    // Continuar o loop do jogo
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [
    gameState, gameOver, isDead, dinoFrame, deathFrame, obstacles, particles, 
    isDucking, isJumping, score, combo, showCombo, isPaused, countdownValue, 
    imagesLoaded, currentSpeed, endGame, checkCollision, createCollisionParticles
  ]);

  // Atualizar tamanho do canvas quando as dimensões mudam
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
  }, [canvasSize]);

  // Efeito para configurar o canvas e o loop de jogo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Redimensionamento inicial
    handleResize();
    
    // Observador de redimensionamento
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    
    // Lidar com redimensionamento da janela
    window.addEventListener('resize', handleResize);

    // Iniciar loop do jogo
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Manipuladores de entrada
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleDuck(true);
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleDuck(false);
      }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      
      // Verificar posição do toque para determinar ação
      const touch = e.touches[0];
      const touchY = touch.clientY;
      const screenHeight = window.innerHeight;
      
      if (touchY > screenHeight * 0.7) {
        // Toque na parte inferior da tela - agachar
        handleDuck(true);
      } else {
        // Toque em qualquer outro lugar - pular
        handleJump();
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      // Parar de agachar quando soltar
      handleDuck(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (jumpSoundTimeoutRef.current) {
        clearTimeout(jumpSoundTimeoutRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [gameLoop, handleJump, handleDuck, handleResize, togglePause]);

  // Funções de navegação
  const handleBack = () => {
    playSound('click');
    navigate('/');
  };

  const handlePlayAgain = () => {
    playSound('click');
    setShowGameOver(false);
    startGame();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container-custom py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <button
            onClick={handleBack}
            className="flex items-center text-text-muted hover:text-text"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar
          </button>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-background-lighter px-4 py-2 rounded-full">
              <Trophy size={20} className="text-primary mr-2" />
              <span className="text-text-muted">Score:</span>
              <span className="text-text font-bold ml-2">{score}/100</span>
            </div>
            
            <div className="flex items-center bg-background-lighter px-4 py-2 rounded-full">
              <Coins size={20} className="text-secondary mr-2" />
              <span className="text-text-muted">Ganhos:</span>
              <span className="text-secondary font-bold ml-2">R$ {gameState?.earnedAmount.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="relative w-full max-w-[800px]">
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-lg cursor-pointer touch-none"
              onClick={handleJump}
              style={{ width: '100%', height: 'auto' }}
            />
            
            {!gameState && !countdownValue && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
                <button
                  onClick={startGame}
                  className="btn-action py-3 px-8 text-lg font-bold"
                >
                  Começar Jogo
                </button>
              </div>
            )}
            
            {isPaused && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg">
                <h3 className="text-2xl font-bold text-white mb-6">Jogo Pausado</h3>
                <button
                  onClick={togglePause}
                  className="btn-action py-3 px-8 text-lg font-bold"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-text-muted text-sm sm:text-base hidden sm:block">
          <div className="flex flex-wrap justify-center gap-4">
            <div>
              <kbd className="px-2 py-1 bg-background-lighter rounded mr-1">Espaço</kbd> 
              ou <kbd className="px-2 py-1 bg-background-lighter rounded">↑</kbd> para pular
            </div>
            <div>
              <kbd className="px-2 py-1 bg-background-lighter rounded">↓</kbd> para agachar
            </div>
            <div>
              <kbd className="px-2 py-1 bg-background-lighter rounded">P</kbd> para pausar
            </div>
          </div>
        </div>
        <div className="text-center text-text-muted text-sm sm:text-base sm:hidden">
          <div>Toque na tela para pular</div>
          <div>Toque na parte inferior para agachar</div>
        </div>
      </main>

      <AnimatePresence>
        {showGameOver && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-background-light rounded-lg p-6 max-w-md w-full shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-action to-primary" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <Trophy size={24} className={gameOutcome === 'victory' ? 'text-green-500 mr-2' : 'text-primary mr-2'} />
                  <h3 className="text-lg font-semibold">
                    {gameOutcome === 'victory' ? 'Vitória!' : 'Fim de Jogo!'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowGameOver(false)}
                  className="text-text-muted hover:text-text p-1 rounded-full hover:bg-background-lighter"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-background-lighter p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-muted">Score Final</span>
                    <span className={`font-bold ${gameOutcome === 'victory' ? 'text-green-500' : 'text-text'}`}>{score}</span>
                  </div>
                  
                  {score < 100 && (
                    <div className="flex items-center justify-between mb-2 text-red-500">
                      <span>Penalidade (-50%)</span>
                      <span>-R$ {((gameState?.earnedAmount || 0) * 0.5).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Valor Final</span>
                    <span className={`font-bold ${gameOutcome === 'victory' ? 'text-green-500' : 'text-secondary'}`}>
                      R$ {finalEarnings.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {gameOutcome === 'victory' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-green-500/20 p-3 rounded-lg text-green-500 text-center font-medium"
                  >
                    <span className="text-lg">🎉</span> Parabéns! Você alcançou 100 pontos e ganhou o prêmio completo!
                  </motion.div>
                ) : (
                  <div className="text-sm text-text-muted text-center p-2">
                    Você perdeu 50% do valor acumulado nesta partida. Tente novamente para chegar a 100 pontos!
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="flex-1 btn-outline py-3"
                >
                  Voltar ao Menu
                </button>
                <button
                  onClick={handlePlayAgain}
                  className="flex-1 btn-action py-3"
                >
                  Jogar Novamente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
};

export default DinoGame;