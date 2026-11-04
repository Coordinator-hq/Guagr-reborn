import { User, Market, Participation, Transaction } from '../types/market';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'alphapool_current_user_id',
  USERS: 'alphapool_users',
  MARKETS: 'alphapool_markets',
  PARTICIPATIONS: 'alphapool_participations',
  TRANSACTIONS: 'alphapool_transactions',
  CURRENT_ROUND_ID: 'alphapool_current_round_id',
  SPEED_MULTIPLIER: 'alphapool_speed_multiplier',
};

// High-fidelity avatars using SVG data URIs for deterministic, zero-network failures
export const AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=AlphaTrader&backgroundColor=0f172a',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoWhale&backgroundColor=1e293b',
  'https://api.dicebear.com/7.x/bottts/svg?seed=QuantAlpha&backgroundColor=022c22',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Satoshi99&backgroundColor=311042',
  'https://api.dicebear.com/7.x/bottts/svg?seed=DeltaHedger&backgroundColor=1e1b4b',
  'https://api.dicebear.com/7.x/bottts/svg?seed=NovaCap&backgroundColor=172554',
  'https://api.dicebear.com/7.x/bottts/svg?seed=HyperBull&backgroundColor=064e3b',
  'https://api.dicebear.com/7.x/bottts/svg?seed=SigmaTrader&backgroundColor=3b0764',
];

export const INITIAL_MAIN_USER: User = {
  userId: 'user_main',
  username: 'ApexTrader',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTrader&backgroundColor=0f172a',
  virtualBalance: 100000,
  totalProfit: 0,
  totalRounds: 0,
  winningRounds: 0,
};

export const INITIAL_TEST_USERS: User[] = [
  INITIAL_MAIN_USER,
  {
    userId: 'user_whale',
    username: 'WhaleDelta',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WhaleDelta&backgroundColor=1e293b',
    virtualBalance: 342000,
    totalProfit: 142000,
    totalRounds: 48,
    winningRounds: 31,
    isSimulated: true,
  },
  {
    userId: 'user_quant',
    username: 'QuantAlpha',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantAlpha&backgroundColor=022c22',
    virtualBalance: 285500,
    totalProfit: 95500,
    totalRounds: 42,
    winningRounds: 27,
    isSimulated: true,
  },
  {
    userId: 'user_macro',
    username: 'MacroPulse',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MacroPulse&backgroundColor=311042',
    virtualBalance: 210000,
    totalProfit: 62000,
    totalRounds: 35,
    winningRounds: 21,
    isSimulated: true,
  },
  {
    userId: 'user_arbitrage',
    username: 'ArbitrageBot',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ArbitrageBot&backgroundColor=1e1b4b',
    virtualBalance: 178000,
    totalProfit: 48000,
    totalRounds: 39,
    winningRounds: 22,
    isSimulated: true,
  },
  {
    userId: 'user_satoshi',
    username: 'Satoshi99',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Satoshi99&backgroundColor=172554',
    virtualBalance: 145000,
    totalProfit: 25000,
    totalRounds: 28,
    winningRounds: 16,
    isSimulated: true,
  },
  {
    userId: 'user_neon',
    username: 'NeonScalper',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonScalper&backgroundColor=064e3b',
    virtualBalance: 88000,
    totalProfit: -12000,
    totalRounds: 26,
    winningRounds: 11,
    isSimulated: true,
  },
  {
    userId: 'user_bear',
    username: 'VentureBear',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=VentureBear&backgroundColor=3b0764',
    virtualBalance: 65000,
    totalProfit: -35000,
    totalRounds: 30,
    winningRounds: 10,
    isSimulated: true,
  },
];

// Helper to seed historical rounds so activity & leaderboards feel rich and live
export function getInitialSeedData(): {
  users: User[];
  markets: Market[];
  participations: Participation[];
  transactions: Transaction[];
} {
  const now = Date.now();
  const ONE_MIN = 1 * 60 * 1000; // 1 minute per round

  // Let's create 3 past rounds and 1 active current round
  const pastRounds: Market[] = [
    {
      roundId: 'R-1045',
      roundNumber: 1045,
      startTime: now - ONE_MIN * 3,
      endTime: now - ONE_MIN * 2,
      status: 'resolved',
      yesTotal: 74000,
      noTotal: 52000,
      totalPot: 126000,
      winningOption: 'YES',
      rolloverAmount: 0,
      resolvedAt: now - ONE_MIN * 2,
      platformFee: 12600,
      distributablePot: 113400,
    },
    {
      roundId: 'R-1046',
      roundNumber: 1046,
      startTime: now - ONE_MIN * 2,
      endTime: now - ONE_MIN,
      status: 'resolved',
      yesTotal: 48000,
      noTotal: 86000,
      totalPot: 134000,
      winningOption: 'NO',
      rolloverAmount: 0,
      resolvedAt: now - ONE_MIN,
      platformFee: 13400,
      distributablePot: 120600,
    },
    {
      roundId: 'R-1047',
      roundNumber: 1047,
      startTime: now - ONE_MIN,
      endTime: now,
      status: 'resolved',
      yesTotal: 65000,
      noTotal: 65000,
      totalPot: 130000,
      winningOption: 'TIE',
      rolloverAmount: 0,
      resolvedAt: now,
      platformFee: 0,
      distributablePot: 0,
    },
  ];

  // Active round with rollover carried over from R-1047 (ties roll over!)
  const currentRound: Market = {
    roundId: 'R-1048',
    roundNumber: 1048,
    startTime: now,
    endTime: now + ONE_MIN,
    status: 'active',
    yesTotal: 25000,
    noTotal: 18000,
    totalPot: 43000 + 130000, // Includes rolled over 130k from R-1047!
    winningOption: null,
    rolloverAmount: 130000,
  };

  const initialParticipations: Participation[] = [
    {
      participationId: 'p-1',
      userId: 'user_whale',
      roundId: 'R-1048',
      selectedOption: 'YES',
      stake: 25000,
      payout: 0,
      result: 'PENDING',
      timestamp: now - 30000,
      username: 'WhaleDelta',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WhaleDelta&backgroundColor=1e293b',
    },
    {
      participationId: 'p-2',
      userId: 'user_quant',
      roundId: 'R-1048',
      selectedOption: 'NO',
      stake: 18000,
      payout: 0,
      result: 'PENDING',
      timestamp: now - 15000,
      username: 'QuantAlpha',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantAlpha&backgroundColor=022c22',
    },
    // Past user participations
    {
      participationId: 'p-past-1',
      userId: 'user_main',
      roundId: 'R-1045',
      selectedOption: 'YES',
      stake: 5000,
      payout: 7662,
      result: 'WIN',
      timestamp: now - ONE_MIN * 3 + 20000,
      username: 'ApexTrader',
    },
    {
      participationId: 'p-past-2',
      userId: 'user_main',
      roundId: 'R-1046',
      selectedOption: 'YES',
      stake: 4000,
      payout: 0,
      result: 'LOSS',
      timestamp: now - ONE_MIN * 2 + 10000,
      username: 'ApexTrader',
    },
  ];

  // Adjust ApexTrader's initial stats based on the 2 past demo rounds
  const mainUserAdjusted: User = {
    ...INITIAL_MAIN_USER,
    virtualBalance: 100000 + (7662 - 5000) - 4000, // 98,662 credits
    totalProfit: (7662 - 5000) - 4000, // -1,338
    totalRounds: 2,
    winningRounds: 1,
  };

  const initialTransactions: Transaction[] = [
    {
      transactionId: 'tx-grant',
      userId: 'user_main',
      amount: 100000,
      type: 'INITIAL_GRANT',
      timestamp: now - ONE_MIN * 4,
      description: 'Initial Beta Capital Grant',
    },
    {
      transactionId: 'tx-stake-1',
      userId: 'user_main',
      amount: -5000,
      type: 'STAKE',
      roundId: 'R-1045',
      timestamp: now - ONE_MIN * 3 + 20000,
      description: 'Round #1045 Wager on YES',
    },
    {
      transactionId: 'tx-payout-1',
      userId: 'user_main',
      amount: 7662,
      type: 'PAYOUT',
      roundId: 'R-1045',
      timestamp: now - ONE_MIN * 2,
      description: 'Round #1045 Win Payout (YES)',
    },
    {
      transactionId: 'tx-stake-2',
      userId: 'user_main',
      amount: -4000,
      type: 'STAKE',
      roundId: 'R-1046',
      timestamp: now - ONE_MIN * 2 + 10000,
      description: 'Round #1046 Wager on YES',
    },
  ];

  const allUsers = INITIAL_TEST_USERS.map(u => u.userId === 'user_main' ? mainUserAdjusted : u);

  return {
    users: allUsers,
    markets: [...pastRounds, currentRound],
    participations: initialParticipations,
    transactions: initialTransactions,
  };
}

export const StorageService = {
  getCurrentUserId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user_main';
  },

  setCurrentUserId(userId: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  },

  loadAllData() {
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    const marketsStr = localStorage.getItem(STORAGE_KEYS.MARKETS);
    const participationsStr = localStorage.getItem(STORAGE_KEYS.PARTICIPATIONS);
    const transactionsStr = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

    if (!usersStr || !marketsStr || !participationsStr || !transactionsStr) {
      const seed = getInitialSeedData();
      this.saveUsers(seed.users);
      this.saveMarkets(seed.markets);
      this.saveParticipations(seed.participations);
      this.saveTransactions(seed.transactions);
      return seed;
    }

    try {
      return {
        users: JSON.parse(usersStr) as User[],
        markets: JSON.parse(marketsStr) as Market[],
        participations: JSON.parse(participationsStr) as Participation[],
        transactions: JSON.parse(transactionsStr) as Transaction[],
      };
    } catch {
      const seed = getInitialSeedData();
      return seed;
    }
  },

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  saveMarkets(markets: Market[]) {
    localStorage.setItem(STORAGE_KEYS.MARKETS, JSON.stringify(markets));
  },

  saveParticipations(participations: Participation[]) {
    localStorage.setItem(STORAGE_KEYS.PARTICIPATIONS, JSON.stringify(participations));
  },

  saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.MARKETS);
    localStorage.removeItem(STORAGE_KEYS.PARTICIPATIONS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ROUND_ID);
    return getInitialSeedData();
  },
};
