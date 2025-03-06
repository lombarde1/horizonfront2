import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Howl } from 'howler';

interface Sounds {
  click: Howl | null;
  hover: Howl | null;
  win: Howl | null;
  deposit: Howl | null;
  jackpot: Howl | null;
  coins: Howl | null;
}

interface SoundContextType {
  sounds: Sounds;
  muted: boolean;
  volume: number;
  initSounds: () => void;
  playSound: (sound: keyof Sounds) => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sounds, setSounds] = useState<Sounds>({
    click: null,
    hover: null,
    win: null,
    deposit: null,
    jackpot: null,
    coins: null
  });
  
  const [muted, setMuted] = useState<boolean>(() => {
    const savedMute = localStorage.getItem('sound_muted');
    return savedMute ? JSON.parse(savedMute) : false;
  });
  
  const [volume, setVolumeState] = useState<number>(() => {
    const savedVolume = localStorage.getItem('sound_volume');
    return savedVolume ? parseFloat(savedVolume) : 0.5;
  });

  const initSounds = useCallback(() => {
    const soundsToLoad: Sounds = {
      click: new Howl({
        src: ['https://cdn.uppbeat.io/audio-files/3f0f4371c2f768e25e6f9f28a16aadc4/62239ec9f57dc1e212d3a01027ea76ce/d9cbaf16ab7638fac63ed5d2f98d8889/STREAMING-digital-button-click-pop-davies-aguirre-1-1-00-00.mp3'],
        volume: volume,
        mute: muted
      }),
      hover: new Howl({
        src: ['https://assets.mixkit.co/sfx/preview/mixkit-interface-hint-notification-911.mp3'],
        volume: volume * 0.3,
        mute: muted
      }),
      win: new Howl({
        src: ['https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'],
        volume: volume,
        mute: muted
      }),
      deposit: new Howl({
        src: ['https://assets.mixkit.co/sfx/preview/mixkit-coins-handling-1939.mp3'],
        volume: volume,
        mute: muted
      }),
      jackpot: new Howl({
        src: ['https://assets.mixkit.co/sfx/preview/mixkit-slot-machine-win-siren-1929.mp3'],
        volume: volume,
        mute: muted
      }),
      coins: new Howl({
        src: ['https://assets.mixkit.co/sfx/preview/mixkit-coins-handling-1939.mp3'],
        volume: volume * 0.5,
        mute: muted,
        loop: true
      })
    };
    
    setSounds(soundsToLoad);
  }, [volume, muted]);

  const playSound = useCallback((sound: keyof Sounds) => {
    if (sounds[sound] && !muted) {
      sounds[sound]?.play();
    }
  }, [sounds, muted]);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const newMuted = !prev;
      localStorage.setItem('sound_muted', JSON.stringify(newMuted));
      
      // Update all sounds
      Object.values(sounds).forEach(sound => {
        if (sound) sound.mute(newMuted);
      });
      
      return newMuted;
    });
  }, [sounds]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    localStorage.setItem('sound_volume', newVolume.toString());
    
    // Update all sounds
    Object.values(sounds).forEach(sound => {
      if (sound) sound.volume(newVolume);
    });
  }, [sounds]);

  const value = {
    sounds,
    muted,
    volume,
    initSounds,
    playSound,
    toggleMute,
    setVolume
  };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};