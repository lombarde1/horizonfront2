import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Clock, Settings, ArrowLeft } from 'lucide-react';
import { userAPI } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { useSound } from '../contexts/SoundContext';

interface UserProfile {
  _id: string;
  username: string;
  balance: number;
  settings: {
    language: string;
    notifications: boolean;
    theme: string;
  };
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { playSound } = useSound();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await userAPI.getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleBack = () => {
    playSound('click');
    navigate(-1);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="bg-background-light rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold">{profile?.username}</h1>
                <p className="text-text-muted">ID: {profile?._id}</p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <motion.div 
            className="bg-background-light rounded-lg p-6 mb-6"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-semibold mb-4">Saldo Disponível</h2>
            <div className="text-3xl font-bold text-secondary">
              R$ {profile?.balance.toFixed(2)}
            </div>
          </motion.div>

          {/* Account Details */}
          <div className="bg-background-light rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Detalhes da Conta</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar size={20} className="text-primary mr-3" />
                <div>
                  <p className="text-text-muted text-sm">Data de Registro</p>
                  <p className="font-medium">{profile?.createdAt && formatDate(profile.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock size={20} className="text-primary mr-3" />
                <div>
                  <p className="text-text-muted text-sm">Último Acesso</p>
                  <p className="font-medium">{profile?.lastLogin && formatDate(profile.lastLogin)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Settings size={20} className="text-primary mr-3" />
                <div>
                  <p className="text-text-muted text-sm">Configurações</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="px-2 py-1 bg-background-lighter rounded-full text-xs">
                      Idioma: {profile?.settings.language.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-background-lighter rounded-full text-xs">
                      Tema: {profile?.settings.theme}
                    </span>
                    <span className="px-2 py-1 bg-background-lighter rounded-full text-xs">
                      Notificações: {profile?.settings.notifications ? 'Ativadas' : 'Desativadas'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;