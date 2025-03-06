import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Wallet, GamepadIcon, AlertTriangle, ChevronDown, ChevronUp,
  Search, Filter, RefreshCw, Check, X, Calendar, ArrowLeft
} from 'lucide-react';
import { adminAPI } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';

interface Overview {
  total_users: number;
  active_users_24h: number;
  total_bets_24h: number;
  total_revenue_24h: number;
  total_withdrawals_24h: number;
  total_deposits_24h: number;
  active_games: number;
  platform_balance: number;
}

interface Transaction {
  id: string;
  user_id: string;
  username: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  payment_details: {
    key_type: string;
    key: string;
  };
}

interface User {
  id: string;
  username: string;
  email: string;
  status: string;
  balance: number;
  total_bets: number;
  total_deposits: number;
  total_withdrawals: number;
  created_at: string;
  last_login: string;
}

interface Game {
  id: string;
  name: string;
  status: string;
  total_bets: number;
  total_wagered: number;
  total_payout: number;
  profit_margin: number;
  active_players: number;
}

const Admin: React.FC = () => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'games' | 'withdrawals' | 'payment'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [pixCredentials, setPixCredentials] = useState<{
    baseUrl?: string;
    webhookUrl?: string;
    isActive?: boolean;
    updatedAt?: string;
  } | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [newPixCredentials, setNewPixCredentials] = useState({
    clientId: '',
    clientSecret: '',
    baseUrl: '',
    webhookUrl: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [balanceReason, setBalanceReason] = useState('');
  const navigate = useNavigate();

  // Format date with validation
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'N/A';
    }
  };

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const { data } = await adminAPI.getOverview();
          setOverview(data);
        } catch (err) {
          console.error('Error loading overview:', err);
        }
      } catch (err: any) {
        if (err.response?.status === 401 && err.response?.data?.message === 'Admin access required') {
          setError('Você não tem permissão para acessar esta área.');
        } else {
          setError('Erro ao carregar dados. Tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load tab data when tab changes or filters update
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'overview') return;
      
      try {
        setLoading(true);
        await loadTabData();
      } catch (err) {
        console.error('Error loading tab data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [activeTab, currentPage, searchTerm, statusFilter, dateRange]);

  // Handle tab change
  const handleTabChange = (tab: 'overview' | 'users' | 'transactions' | 'games') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
    setStatusFilter('');
  };

  const loadTabData = async () => {
    try {
      switch (activeTab) {
        case 'users':
          const usersResponse = await adminAPI.getUsers(currentPage, 10, statusFilter, searchTerm);
          setUsers(usersResponse.data.users);
          setTotalPages(usersResponse.data.pagination.total_pages);
          console.log('Users loaded:', usersResponse.data.users);
          break;

        case 'transactions':
          const transactionsResponse = await adminAPI.getTransactions({
            page: currentPage,
            limit: 10,
            status: statusFilter,
            start_date: dateRange.start,
            end_date: dateRange.end
          });
          setTransactions(transactionsResponse.data.transactions);
          setTotalPages(transactionsResponse.data.pagination.total_pages);
          console.log('Transactions loaded:', transactionsResponse.data.transactions);
          break;

        case 'games':
          const gamesResponse = await adminAPI.getGames();
          setGames(gamesResponse.data.games);
          console.log('Games loaded:', gamesResponse.data.games);
          break;
          
        case 'withdrawals':
          const withdrawalsResponse = await adminAPI.getWithdrawals({
            page: currentPage,
            limit: 10,
            status: statusFilter
          });
          setWithdrawals(withdrawalsResponse.data.withdrawals);
          setTotalPages(withdrawalsResponse.data.pagination.total_pages);
          break;
          
        case 'payment':
          try {
            const { data } = await adminAPI.getCurrentPixCredentials();
            setPixCredentials(data);
          } catch (err) {
            console.error('Error loading PIX credentials:', err);
            setPixCredentials(null);
          }
          break;
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await adminAPI.updateUserStatus(userId, status, 'Status updated by admin');
      await loadTabData();
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  const handleUpdateTransactionStatus = async (transactionId: string, status: string) => {
    try {
      await adminAPI.updateTransactionStatus(transactionId, status, 'Status updated by admin');
      await loadTabData();
    } catch (err) {
      console.error('Error updating transaction status:', err);
    }
  };

  const handleUpdateGameSettings = async (gameId: string, settings: any) => {
    try {
      await adminAPI.updateGameSettings(gameId, settings);
      await loadTabData();
    } catch (err) {
      console.error('Error updating game settings:', err);
    }
  };

  const handleApproveWithdrawal = async (transactionId: string) => {
    try {
      await adminAPI.approveWithdrawal(transactionId);
      await loadTabData();
    } catch (err) {
      console.error('Error approving withdrawal:', err);
    }
  };

  const handleRejectWithdrawal = async (transactionId: string) => {
    try {
      await adminAPI.rejectWithdrawal(transactionId);
      await loadTabData();
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser || !balanceAmount || !balanceReason) return;
    
    try {
      await adminAPI.updateUserBalance(
        selectedUser.id,
        parseFloat(balanceAmount),
        balanceType,
        balanceReason
      );
      setShowBalanceModal(false);
      setSelectedUser(null);
      setBalanceAmount('');
      setBalanceType('ADD');
      setBalanceReason('');
      await loadTabData();
    } catch (err) {
      console.error('Error updating user balance:', err);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container-custom py-6 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">{error}</h2>
            <button
              onClick={() => navigate('/')}
              className="btn-action py-2 px-6"
            >
              <ArrowLeft size={20} className="mr-2 inline" />
              Voltar
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container-custom py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-text-muted">Gerencie usuários, transações e jogos da plataforma</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-background-light rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-text-muted">Usuários Ativos (24h)</h3>
              <Users size={20} className="text-primary" />
            </div>
            <p className="text-2xl font-bold">{overview?.active_users_24h}</p>
            <p className="text-sm text-text-muted">Total: {overview?.total_users}</p>
          </div>

          <div className="bg-background-light rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-text-muted">Receita (24h)</h3>
              <Wallet size={20} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">
              R$ {overview?.total_revenue_24h?.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-text-muted">
              {overview?.total_bets_24h} apostas
            </p>
          </div>

          <div className="bg-background-light rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-text-muted">Jogos Ativos</h3>
              <GamepadIcon size={20} className="text-primary" />
            </div>
            <p className="text-2xl font-bold">{overview?.active_games}</p>
            <div className="flex justify-between text-sm">
              <span className="text-green-500">↑ {overview?.total_deposits_24h?.toFixed(2) || '0.00'}</span>
              <span className="text-red-500">↓ {overview?.total_withdrawals_24h?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div className="bg-background-light rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-text-muted">Saldo da Plataforma</h3>
              <Wallet size={20} className="text-secondary" />
            </div>
            <p className="text-2xl font-bold text-secondary">
              R$ {overview?.platform_balance?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-background-lighter">
            <nav className="flex space-x-4">
              <button
                onClick={() => handleTabChange('overview')}
                className={`py-2 px-4 -mb-px ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-action text-action'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => handleTabChange('users')}
                className={`py-2 px-4 -mb-px ${
                  activeTab === 'users'
                    ? 'border-b-2 border-action text-action'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Usuários
              </button>
              <button
                onClick={() => handleTabChange('transactions')}
                className={`py-2 px-4 -mb-px ${
                  activeTab === 'transactions'
                    ? 'border-b-2 border-action text-action'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Transações
              </button>
              <button
                onClick={() => handleTabChange('games')}
                className={`py-2 px-4 -mb-px ${
                  activeTab === 'games'
                    ? 'border-b-2 border-action text-action'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Jogos
              </button>
              <button
                onClick={() => handleTabChange('withdrawals')}
                className={`py-2 px-4 -mb-px ${
                  activeTab === 'withdrawals'
                    ? 'border-b-2 border-action text-action'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Saques
              </button>
              <button
                onClick={() => handleTabChange('payment')}
                className={`py-2 px-4 -mb-px ${
                  activeTab === 'payment'
                    ? 'border-b-2 border-action text-action'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Pagamentos
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-background-light rounded-lg p-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background-lighter rounded-lg border border-background text-text placeholder-text-muted/50"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-background-lighter rounded-lg border border-background text-text"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
                <option value="pending">Pendente</option>
                <option value="completed">Concluído</option>
              </select>

              <button
                onClick={loadTabData}
                className="p-2 bg-background-lighter rounded-lg border border-background text-text-muted hover:text-text"
                title="Atualizar"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-background-lighter">
                    <th className="pb-3 font-medium text-text-muted">Usuário</th>
                    <th className="pb-3 font-medium text-text-muted">Status</th>
                    <th className="pb-3 font-medium text-text-muted">Saldo</th>
                    <th className="pb-3 font-medium text-text-muted">Apostas</th>
                    <th className="pb-3 font-medium text-text-muted">Último Acesso</th>
                    <th className="pb-3 font-medium text-text-muted">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-background-lighter">
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-text-muted">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === 'active' ? 'bg-green-500/20 text-green-500' :
                          user.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className="font-medium">R$ {user.balance.toFixed(2)}</p>
                      </td>
                      <td className="py-4">
                        <p>{user.total_bets}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-text-muted">
                          {formatDate(user.last_login)}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleUpdateUserStatus(user.id, 'suspended')}
                              className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-sm hover:bg-red-500/30"
                            >
                              Suspender
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserStatus(user.id, 'active')}
                              className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg text-sm hover:bg-green-500/30"
                            >
                              Ativar
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBalanceModal(true);
                            }}
                            className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30"
                          >
                            Alterar Saldo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-background-lighter">
                    <th className="pb-3 font-medium text-text-muted">ID</th>
                    <th className="pb-3 font-medium text-text-muted">Usuário</th>
                    <th className="pb-3 font-medium text-text-muted">Tipo</th>
                    <th className="pb-3 font-medium text-text-muted">Valor</th>
                    <th className="pb-3 font-medium text-text-muted">Status</th>
                    <th className="pb-3 font-medium text-text-muted">Data</th>
                    <th className="pb-3 font-medium text-text-muted">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-background-lighter">
                      <td className="py-4">
                        <p className="font-mono text-sm">{transaction.id}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-medium">{transaction.username}</p>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.type === 'deposit' ? 'bg-green-500/20 text-green-500' :
                          transaction.type === 'withdrawal' ? 'bg-red-500/20 text-red-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className="font-medium">R$ {transaction.amount.toFixed(2)}</p>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-text-muted">
                          {formatDate(transaction.created_at)}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          {transaction.status === 'pending' && (
                            <>
                              <button
                                onClick={() => transaction.type === 'withdrawal' 
                                  ? handleApproveWithdrawal(transaction.id)
                                  : handleUpdateTransactionStatus(transaction.id, 'completed')}
                                className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg text-sm hover:bg-green-500/30"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => transaction.type === 'withdrawal'
                                  ? handleRejectWithdrawal(transaction.id)
                                  : handleUpdateTransactionStatus(transaction.id, 'failed')}
                                className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-sm hover:bg-red-500/30"
                              >
                                Recusar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'games' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-background-lighter">
                    <th className="pb-3 font-medium text-text-muted">Jogo</th>
                    <th className="pb-3 font-medium text-text-muted">Status</th>
                    <th className="pb-3 font-medium text-text-muted">Apostas</th>
                    <th className="pb-3 font-medium text-text-muted">Total Apostado</th>
                    <th className="pb-3 font-medium text-text-muted">Total Pago</th>
                    <th className="pb-3 font-medium text-text-muted">Margem</th>
                    <th className="pb-3 font-medium text-text-muted">Jogadores</th>
                    <th className="pb-3 font-medium text-text-muted">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id} className="border-b border-background-lighter">
                      <td className="py-4">
                        <p className="font-medium">{game.name}</p>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          game.status === 'active' ? 'bg-green-500/20 text-green-500' :
                          game.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {game.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <p>{game.total_bets}</p>
                      </td>
                      <td className="py-4">
                        <p>R$ {game.total_wagered.toFixed(2)}</p>
                      </td>
                      <td className="py-4">
                        <p>R$ {game.total_payout.toFixed(2)}</p>
                      </td>
                      <td className="py-4">
                        <p className={game.profit_margin >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {game.profit_margin.toFixed(2)}%
                        </p>
                      </td>
                      <td className="py-4">
                        <p>{game.active_players}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          {game.status === 'active' ? (
                            <button
                              onClick={() => handleUpdateGameSettings(game.id, {
                                status: 'maintenance',
                                min_bet: 1,
                                max_bet: 1000,
                                house_edge: 5
                              })}
                              className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-lg text-sm hover:bg-yellow-500/30"
                            >
                              Manutenção
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateGameSettings(game.id, {
                                status: 'active',
                                min_bet: 1,
                                max_bet: 1000,
                                house_edge: 5
                              })}
                              className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg text-sm hover:bg-green-500/30"
                            >
                              Ativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-background-lighter">
                    <th className="pb-3 font-medium text-text-muted">ID</th>
                    <th className="pb-3 font-medium text-text-muted">Usuário</th>
                    <th className="pb-3 font-medium text-text-muted">Valor</th>
                    <th className="pb-3 font-medium text-text-muted">Chave PIX</th>
                    <th className="pb-3 font-medium text-text-muted">Status</th>
                    <th className="pb-3 font-medium text-text-muted">Data</th>
                    <th className="pb-3 font-medium text-text-muted">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-background-lighter">
                      <td className="py-4">
                        <p className="font-mono text-sm">{withdrawal.id}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-medium">{withdrawal.username}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-medium">R$ {withdrawal.amount.toFixed(2)}</p>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm text-text-muted">{withdrawal.payment_details.key_type}</p>
                          <p className="font-mono text-sm">{withdrawal.payment_details.key}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-text-muted">
                          {formatDate(withdrawal.created_at)}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          {withdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg text-sm hover:bg-green-500/30"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-sm hover:bg-red-500/30"
                              >
                                Recusar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payment' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Configurações de Pagamento</h3>
                <p className="text-text-muted">Gerencie as credenciais de integração PIX da plataforma.</p>
              </div>

              <div className="bg-background-lighter p-6 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Credenciais PIX</h4>
                  <div className="flex items-center space-x-2">
                    {pixCredentials?.isActive && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
                        Ativo
                      </span>
                    )}
                    <button
                      onClick={() => setShowPixModal(true)}
                      className="btn-action py-2 px-4"
                    >
                      {pixCredentials ? 'Atualizar Credenciais' : 'Configurar PIX'}
                    </button>
                  </div>
                </div>

                {pixCredentials ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-text-muted mb-1">URL Base</p>
                      <p className="font-mono bg-background p-2 rounded">{pixCredentials.baseUrl || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted mb-1">URL do Webhook</p>
                      <p className="font-mono bg-background p-2 rounded">{pixCredentials.webhookUrl || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted mb-1">Última Atualização</p>
                      <p>{formatDate(pixCredentials.updatedAt)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-text-muted">Nenhuma credencial PIX configurada.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {(activeTab === 'users' || activeTab === 'transactions' || activeTab === 'withdrawals') && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-text-muted">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-background-lighter rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-background-lighter rounded-lg disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* Balance Update Modal */}
      <AnimatePresence>
        {showBalanceModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-light rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Alterar Saldo do Usuário</h3>
                  <p className="text-text-muted">{selectedUser.username}</p>
                </div>
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className="text-text-muted hover:text-text p-1 rounded-full hover:bg-background-lighter"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Tipo de Operação
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBalanceType('ADD')}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        balanceType === 'ADD'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-background-lighter text-text-muted hover:bg-background'
                      }`}
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => setBalanceType('SUBTRACT')}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        balanceType === 'SUBTRACT'
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-background-lighter text-text-muted hover:bg-background'
                      }`}
                    >
                      Subtrair
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="w-full p-2 rounded-lg bg-background-lighter border border-background text-text"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Motivo
                  </label>
                  <input
                    type="text"
                    value={balanceReason}
                    onChange={(e) => setBalanceReason(e.target.value)}
                    className="w-full p-2 rounded-lg bg-background-lighter border border-background text-text"
                    placeholder="Informe o motivo da alteração"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className="px-4 py-2 rounded-lg bg-background-lighter text-text-muted hover:text-text"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateBalance}
                  disabled={!balanceAmount || !balanceReason}
                  className={`px-4 py-2 rounded-lg ${
                    balanceType === 'ADD' ? 'bg-green-500' : 'bg-red-500'
                  } text-white ${
                    (!balanceAmount || !balanceReason) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* PIX Credentials Modal */}
      <AnimatePresence>
        {showPixModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-light rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Configurar Credenciais PIX</h3>
                  <p className="text-text-muted text-sm">Preencha as informações de integração</p>
                </div>
                <button
                  onClick={() => setShowPixModal(false)}
                  className="text-text-muted hover:text-text p-1 rounded-full hover:bg-background-lighter"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={newPixCredentials.clientId}
                    onChange={(e) => setNewPixCredentials(prev => ({
                      ...prev,
                      clientId: e.target.value
                    }))}
                    className="w-full p-2 rounded-lg bg-background-lighter border border-background text-text"
                    placeholder="Digite o Client ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={newPixCredentials.clientSecret}
                    onChange={(e) => setNewPixCredentials(prev => ({
                      ...prev,
                      clientSecret: e.target.value
                    }))}
                    className="w-full p-2 rounded-lg bg-background-lighter border border-background text-text"
                    placeholder="Digite o Client Secret"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    URL Base
                  </label>
                  <input
                    type="text"
                    value={newPixCredentials.baseUrl}
                    onChange={(e) => setNewPixCredentials(prev => ({
                      ...prev,
                      baseUrl: e.target.value
                    }))}
                    className="w-full p-2 rounded-lg bg-background-lighter border border-background text-text"
                    placeholder="https://api.exemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    URL do Webhook
                  </label>
                  <input
                    type="text"
                    value={newPixCredentials.webhookUrl}
                    onChange={(e) => setNewPixCredentials(prev => ({
                      ...prev,
                      webhookUrl: e.target.value
                    }))}
                    className="w-full p-2 rounded-lg bg-background-lighter border border-background text-text"
                    placeholder="https://seu-site.com/webhook/pix"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPixModal(false)}
                  className="px-4 py-2 rounded-lg bg-background-lighter text-text-muted hover:text-text"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await adminAPI.updatePixCredentials(newPixCredentials);
                      await loadTabData();
                      setShowPixModal(false);
                      setNewPixCredentials({
                        clientId: '',
                        clientSecret: '',
                        baseUrl: '',
                        webhookUrl: ''
                      });
                    } catch (err) {
                      console.error('Error updating PIX credentials:', err);
                    }
                  }}
                  disabled={!newPixCredentials.clientId || !newPixCredentials.clientSecret || !newPixCredentials.webhookUrl}
                  className="px-4 py-2 rounded-lg bg-action text-white hover:bg-action-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar Credenciais
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default Admin