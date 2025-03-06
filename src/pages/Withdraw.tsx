import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Banknote, Building2, Bitcoin, X, AlertCircle } from 'lucide-react';
import { pixAPI } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';

const pixKeyTypes = [
  { id: 'CPF', name: 'CPF' },
  { id: 'EMAIL', name: 'E-mail' },
  { id: 'PHONE', name: 'Telefone' },
  { id: 'RANDOM', name: 'Chave Aleatória' }
];

const withdrawalMethods = [
  { id: 'pix', name: 'PIX', Icon: Banknote },
  { id: 'bank', name: 'Transferência Bancária', Icon: Building2 },
  { id: 'crypto', name: 'Criptomoedas', Icon: Bitcoin },
];

const Withdraw: React.FC = () => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [showPopup, setShowPopup] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [pixKeyType, setPixKeyType] = useState<string>('');
  const [pixKey, setPixKey] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { playSound } = useSound();

  const handleMethodSelect = (methodId: string) => {
    playSound('click');
    if (methodId === 'pix') {
      setSelectedMethod(methodId);
    } else {
      setShowPopup(true);
    }
  };

  const handleClosePopup = () => {
    playSound('click');
    setShowPopup(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleMaxAmount = () => {
    playSound('click');
    if (user) {
      setAmount(user.balance.toString());
    }
  };

  const handleNextStep = async () => {
    playSound('click');
    if (step === 1 && selectedMethod) {
      setStep(2);
    } else if (
      step === 2 && 
      amount && 
      parseInt(amount) >= 50 && 
      parseInt(amount) <= (user?.balance || 0) &&
      pixKeyType &&
      pixKey
    ) {
      setStep(3);
      try {
        const response = await pixAPI.requestWithdrawal(
          parseFloat(amount),
          pixKeyType,
          pixKey
        );
        
        if (response.data) {
          playSound('win');
          setSuccess(true);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao processar o saque');
        setStep(2);
      }
    }
  };

  const handlePreviousStep = () => {
    playSound('click');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    playSound('click');
    navigate('/');
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Selecione o método de saque</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {withdrawalMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? 'border-action bg-action/10'
                      : 'border-background-lighter bg-background-lighter hover:border-primary'
                  }`}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="flex items-center">
                    <method.Icon size={24} className="mr-3 text-primary" />
                    <span className="font-medium">{method.name}</span>
                    {selectedMethod === method.id && (
                      <Check className="ml-auto text-action" size={20} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Qual valor você deseja sacar?</h3>
            
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">Saldo disponível: <span className="text-secondary">R$ {user?.balance.toFixed(2)}</span></p>
                <button
                  onClick={handleMaxAmount}
                  className="text-sm text-primary hover:text-primary-light"
                >
                  Sacar tudo
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-md mb-4">
                  {error}
                </div>
              )}
              
              <div className="flex items-center border-b-2 border-background-lighter py-2">
                <span className="text-xl font-medium mr-2">R$</span>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="appearance-none bg-transparent border-none w-full text-text py-1 leading-tight focus:outline-none text-xl"
                  placeholder="0"
                />
              </div>
              {parseInt(amount) < 50 && amount !== '' && (
                <p className="text-red-500 text-sm mt-2">O valor mínimo para saque é R$ 50</p>
              )}
              {parseInt(amount) > (user?.balance || 0) && (
                <p className="text-red-500 text-sm mt-2">Valor maior que o saldo disponível</p>
              )}
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Tipo de Chave PIX
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {pixKeyTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPixKeyType(type.id)}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        pixKeyType === type.id
                          ? 'bg-action text-white'
                          : 'bg-background-lighter text-text-muted hover:bg-background'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={
                    pixKeyType === 'CPF' ? '000.000.000-00' :
                    pixKeyType === 'EMAIL' ? 'seu@email.com' :
                    pixKeyType === 'PHONE' ? '(00) 00000-0000' :
                    pixKeyType === 'RANDOM' ? 'Sua chave aleatória' :
                    'Selecione o tipo de chave primeiro'
                  }
                  className="w-full p-3 rounded-lg bg-background-lighter border border-background text-text placeholder-text-muted/50 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            
            <div className="bg-background-lighter p-4 rounded-lg">
              <h4 className="font-medium mb-2">Informações importantes:</h4>
              <ul className="text-sm text-text-muted space-y-1">
                <li>• Valor mínimo para saque: R$ 50</li>
                <li>• Prazo de processamento: até 24 horas úteis</li>
                <li>• Não há taxa para saques</li>
              </ul>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center">
            {!success ? (
              <div>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-medium mb-2">Processando seu saque</h3>
                <p className="text-text-muted">Por favor, aguarde enquanto processamos sua solicitação...</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={32} className="text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-medium mb-2">Solicitação de saque enviada!</h3>
                <p className="text-text-muted mb-6">
                  Seu saque de <span className="text-secondary font-bold">R$ {amount}</span> foi solicitado com sucesso e está em processamento.
                </p>
                <div className="bg-background-lighter p-4 rounded-lg text-left mb-6">
                  <h4 className="font-medium mb-2">Detalhes da transação:</h4>
                  <ul className="text-sm text-text-muted space-y-1">
                    <li><span className="text-text">Método:</span> {withdrawalMethods.find(m => m.id === selectedMethod)?.name}</li>
                    <li><span className="text-text">Valor:</span> R$ {amount}</li>
                    <li><span className="text-text">Tipo de Chave PIX:</span> {pixKeyTypes.find(t => t.id === pixKeyType)?.name}</li>
                    <li><span className="text-text">Chave PIX:</span> {pixKey}</li>
                    <li><span className="text-text">Status:</span> Em processamento</li>
                    <li><span className="text-text">Prazo estimado:</span> Até 24 horas úteis</li>
                  </ul>
                </div>
                <button
                  onClick={handleFinish}
                  className="btn-action py-3 px-8 mx-auto"
                >
                  Voltar para o Cassino
                </button>
              </motion.div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Payment Method Not Available Popup */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-light rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <AlertCircle size={24} className="text-action mr-2" />
                  <h3 className="text-lg font-medium">Método Indisponível</h3>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="text-text-muted hover:text-text p-1 rounded-full hover:bg-background-lighter"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-text-muted mb-6">
                No momento, apenas saques via PIX estão disponíveis para o seu país.
              </p>
              
              <button
                onClick={handleClosePopup}
                className="w-full btn-action py-2"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-grow container-custom py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            {step > 1 && !success && (
              <button
                onClick={handlePreviousStep}
                className="mr-4 p-2 rounded-full bg-background-lighter hover:bg-background-light"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-2xl font-bold neon-text">Sacar</h2>
          </div>
          
          {/* Progress Steps */}
          {!success && (
            <div className="flex items-center mb-8">
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      stepNumber === step
                        ? 'bg-action text-white'
                        : stepNumber < step
                        ? 'bg-primary text-white'
                        : 'bg-background-lighter text-text-muted'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        stepNumber < step ? 'bg-primary' : 'bg-background-lighter'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          
          <div className="bg-background-light rounded-lg p-6">
            {renderStepContent()}
            
            {step < 3 && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNextStep}
                  disabled={
                    (step === 1 && !selectedMethod) ||
                    (step === 2 && (
                      !amount || 
                      parseInt(amount) < 50 || 
                      parseInt(amount) > (user?.balance || 0) ||
                      !pixKeyType ||
                      !pixKey
                    ))
                  }
                  className={`btn-action py-3 px-8 ${
                    (step === 1 && !selectedMethod) ||
                    (step === 2 && (
                      !amount || 
                      parseInt(amount) < 50 || 
                      parseInt(amount) > (user?.balance || 0) ||
                      !pixKeyType ||
                      !pixKey
                    ))
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {step === 2 ? 'Solicitar Saque' : 'Continuar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Withdraw