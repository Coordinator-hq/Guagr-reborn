export type MarketOption = 'YES' | 'NO';
export type MarketStatus = 'active' | 'resolving' | 'resolved' | 'rollover';

export interface User {
  userId: string;
  username: string;
  avatar: string;
  virtualBalance: number;
  totalProfit: number; // Cumulative net profit in virtual credits
  totalRounds: number;
  winningRounds: number;
  isSimulated?: boolean;
}

export interface Market {
  roundId: string;
  roundNumber: number;
  startTime: number;
  endTime: number;
  status: MarketStatus;
  yesTotal: number;
  noTotal: number;
  totalPot: number;
  winningOption: MarketOption | 'TIE' | null;
  rolloverAmount: number;
  resolvedAt?: number;
  platformFee?: number;
  distributablePot?: number;
}

export interface Participation {
  participationId: string;
  userId: string;
  roundId: string;
  selectedOption: MarketOption;
  stake: number;
  payout: number;
  result: 'PENDING' | 'WIN' | 'LOSS' | 'ROLLOVER';
  timestamp: number;
  username?: string;
  avatar?: string;
}

export type TransactionType = 'INITIAL_GRANT' | 'STAKE' | 'PAYOUT' | 'ROLLOVER_REFUND';

export interface Transaction {
  transactionId: string;
  userId: string;
  amount: number; // negative for stakes, positive for payouts
  type: TransactionType;
  roundId?: string;
  timestamp: number;
  description: string;
}

export type LeaderboardTimeframe = 'all-time' | 'weekly' | 'daily';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  virtualBalance: number;
  totalProfit: number;
  winningRounds: number;
  totalRounds: number;
  winRate: number;
  isCurrentUser: boolean;
}

export interface LiveActivityFeedItem {
  id: string;
  username: string;
  avatar: string;
  option: MarketOption;
  stake: number;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'WIN' | 'LOSS' | 'ROLLOVER' | 'ROUND_START' | 'STAKE_CONFIRMED' | 'MARKET_ALERT';
  roundId?: string;
}
