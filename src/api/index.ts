import axios from 'axios';

const API_BASE_URL = 'https://horizon777api-production.up.railway.app/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: (username: string, password: string) => 
    api.post('/api/auth/register', { username, password }),
  
  login: (username: string, password: string) => 
    api.post('/api/auth/login', { username, password }),
  
  getCurrentUser: () => 
    api.get('/api/auth/me'),
  
  logout: () => 
    api.post('/api/auth/logout')
};

// User API
export const userAPI = {
  getProfile: () => 
    api.get('/api/users/profile'),
  
  updateSettings: (settings: { language?: string; notifications?: boolean; theme?: string }) => 
    api.put('/api/users/settings', settings)
};

// Games API
export const gamesAPI = {
  getAllGames: () => 
    api.get('/api/games'),
  
  getFeaturedGames: () => 
    api.get('/api/games/featured'),
  
  getGameCategories: () => 
    api.get('/api/games/categories'),
  
  getGameDetails: (id: string) => 
    api.get(`/api/games/${id}`)
};

// PIX API
export const pixAPI = {
  generateQRCode: (amount: number) => 
    api.post('/api/pix/generate', { amount }),
  
  checkStatus: (externalId: string) => 
    api.get(`/api/pix/status/${externalId}`),
    
  requestWithdrawal: (amount: number, pixKeyType: string, pixKey: string) =>
    api.post('/api/withdrawal/request', { amount, pixKeyType, pixKey })
};

// Dino Game API
export const dinoAPI = {
  startGame: () => 
    api.post('/api/dino/start'),
  
  jump: (gameId: string) => 
    api.post(`/api/dino/${gameId}/jump`),
  
  endGame: (gameId: string) => 
    api.post(`/api/dino/${gameId}/end`),
  
  getHistory: () => 
    api.get('/api/dino/history'),
  
  getActiveGame: () => 
    api.get('/api/dino/active')
};

// Bonus API
export const bonusAPI = {
  claimBonus: () => 
    api.post('/api/bonus/claim')
};

// Admin API
export const adminAPI = {
  getOverview: () => 
    api.get('/api/admin/analytics/overview'),
  
  getStatistics: (startDate: string, endDate: string, type: string) => 
    api.get('/api/admin/analytics/statistics', { params: { start_date: startDate, end_date: endDate, type } }),
  
  getUsers: (page: number, limit: number, status?: string, search?: string) => 
    api.get('/api/admin/users', { params: { page, limit, status, search } }),
  
  updateUserStatus: (userId: string, status: string, reason: string) => 
    api.patch(`/api/admin/users/${userId}/status`, { status, reason }),
  
  getTransactions: (params: {
    page: number;
    limit: number;
    type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => 
    api.get('/api/admin/transactions', { params }),
  
  updateTransactionStatus: (transactionId: string, status: string, notes: string) => 
    api.patch(`/api/admin/transactions/${transactionId}/status`, { status, notes }),
  
  // Withdrawal Management
  approveWithdrawal: (transactionId: string) =>
    api.patch(`/api/admin/withdrawals/${transactionId}/approve`),
  
  rejectWithdrawal: (transactionId: string) =>
    api.patch(`/api/admin/withdrawals/${transactionId}/reject`),
  
  // User Balance Management
  updateUserBalance: (userId: string, amount: number, type: 'ADD' | 'SUBTRACT', reason: string) =>
    api.patch(`/api/admin/users/${userId}/balance`, { amount, type, reason }),
  
  getGames: () => 
    api.get('/api/admin/games'),
  
  // Withdrawal Management
  getWithdrawals: (params: {
    page: number;
    limit: number;
    status?: string;
  }) => 
    api.get('/api/admin/withdrawals', { params }),

  // PIX Credentials Management
  getCurrentPixCredentials: () =>
    api.get('/api/admin/pix-credentials/current'),

  updatePixCredentials: (credentials: {
    clientId: string;
    clientSecret: string;
    baseUrl?: string;
    webhookUrl: string;
  }) =>
    api.put('/api/admin/pix-credentials/update', credentials),
  
  updateGameSettings: (gameId: string, settings: {
    status: string;
    min_bet: number;
    max_bet: number;
    house_edge: number;
  }) => 
    api.patch(`/api/admin/games/${gameId}/settings`, settings)
};

export default api;