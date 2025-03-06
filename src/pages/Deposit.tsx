import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Banknote, CreditCard, Building2, Bitcoin, X, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { pixAPI } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSound } from '../contexts/SoundContext';
import { useAuth } from '../contexts/AuthContext';

const paymentMethods = [
  { id: 'pix', name: 'PIX', Icon: Banknote },
  { id: 'credit', name: 'Cartão de Crédito', Icon: CreditCard },
  { id: 'bank', name: 'Transferência Bancária', Icon: Building2 },
  { id: 'crypto', name: 'Criptomoedas', Icon: Bitcoin },
];

const predefinedAmounts = [30, 50, 100, 200, 500];

const Deposit: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [showPopup, setShowPopup] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [success, setSuccess] = useState<boolean>(false);
  const [qrCode, setQRCode] = useState<string>('');
  const [pixCode, setPixCode] = useState<string>('');
  const [externalId, setExternalId] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState<number | null>(null);
  const navigate = useNavigate();
  const { playSound } = useSound();
  const { updateUser } = useAuth();

  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopySuccess(true);
      playSound('click');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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

  const handlePredefinedAmount = (value: number) => {
    playSound('click');
    setAmount(value.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleNextStep = () => {
    playSound('click');
    if (step === 1 && selectedMethod) {
      setStep(2);
    } else if (step === 2 && amount && parseInt(amount) >= 30) {
      setStep(3);
      generatePixQRCode();
    }
  };

  const generatePixQRCode = async () => {
    try {
      const { data } = await pixAPI.generateQRCode(parseFloat(amount));
      setQRCode(data.qr_code);
      setPixCode(data.qr_code);
      setExternalId(data.external_id);
      
      // Start checking payment status
      const interval = window.setInterval(async () => {
        const { data: statusData } = await pixAPI.checkStatus(data.external_id);
        if (statusData.status === 'COMPLETED') {
          clearInterval(interval);
          setStatusCheckInterval(null);
          playSound('deposit');
          setSuccess(true);
          if (statusData.metadata?.payerInfo) {
            updateUser(statusData.user);
          }
        }
      }, 3000);
      
      setStatusCheckInterval(interval);
    } catch (error) {
      console.error('Error generating PIX QR Code:', error);
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
            <h3 className="text-lg font-medium mb-4">Selecione o método de pagamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
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
            <h3 className="text-lg font-medium mb-4">Qual valor você deseja depositar?</h3>
            
            <div className="mb-6">
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
              {parseInt(amount) < 30 && amount !== '' && (
                <p className="text-red-500 text-sm mt-2">O valor mínimo para depósito é R$ 30</p>
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-text-muted mb-2">Valores sugeridos:</p>
              <div className="flex flex-wrap gap-2">
                {predefinedAmounts.map((value) => (
                  <button
                    key={value}
                    className={`px-4 py-2 rounded-full text-sm ${
                      amount === value.toString()
                        ? 'bg-action text-white'
                        : 'bg-background-lighter text-text-muted hover:bg-background-light'
                    }`}
                    onClick={() => handlePredefinedAmount(value)}
                  >
                    R$ {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center">
            {!qrCode ? (
              <div>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-medium mb-2">Processando seu depósito</h3>
                <p className="text-text-muted">Por favor, aguarde enquanto processamos sua solicitação...</p>
              </div>
            ) : !success ? (
              <div>
                <h3 className="text-xl font-medium mb-4">Escaneie o QR Code PIX</h3>
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="bg-white p-4 rounded-lg">
                      <QRCodeSVG
                        value={qrCode}
                        size={200}
                        level="L"
                        includeMargin={true}
                        className="w-[200px] h-[200px]"
                      />
                    </div>
                  </div>
                  
                  <div className="w-full max-w-sm">
                    <div className="bg-background-lighter rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-muted">PIX Copia e Cola</span>
                        <button
                          onClick={handleCopyPix}
                          className={`text-sm px-3 py-1 rounded-full transition-colors ${
                            copySuccess
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-primary/20 text-primary hover:bg-primary/30'
                          }`}
                        >
                          {copySuccess ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="text-xs bg-background p-2 rounded break-all">
                        {pixCode}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-text-muted mb-4">
                  Abra o app do seu banco, escaneie o QR Code e confirme o pagamento de <span className="text-secondary font-bold">R$ {amount}</span>
                </p>
                <div className="animate-pulse">
                  <p className="text-text-muted">Aguardando confirmação do pagamento...</p>
                </div>
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
                <h3 className="text-xl font-medium mb-2">Depósito realizado com sucesso!</h3>
                <p className="text-text-muted mb-6">
                  Seu depósito de <span className="text-secondary font-bold">R$ {amount}</span> foi processado com sucesso.
                </p>
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
                No momento, apenas pagamentos via PIX estão disponíveis para o seu país.
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
            <h2 className="text-2xl font-bold neon-text">Depositar</h2>
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
                    (step === 1 && !selectedMethod) || (step === 2 && (!amount || parseInt(amount) < 30))
                  }
                  className={`btn-action py-3 px-8 ${
                    (step === 1 && !selectedMethod) || (step === 2 && (!amount || parseInt(amount) < 30))
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {step === 2 ? 'Depositar' : 'Continuar'}
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

export default Deposit