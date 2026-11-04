import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  User,
  Market,
  Participation,
  Transaction,
  MarketOption,
  LeaderboardEntry,
  LeaderboardTimeframe,
  LiveActivityFeedItem,
  AppNotification,
} from '../types/market';

interface ResolutionSummary {
  roundId: string;
  roundNumber: number;
  winningOption: MarketOption | 'TIE';
  yesTotal: number;
  noTotal: number;
  totalPot: number;
  userParticipations: Participation[];
  rolloverAmountNext: number;
  payout: number;
  netProfit: number;
}

interface MarketContextType {
  currentUser: User;
  allUsers: User[];
  currentRound: Market;
  pastRounds: Market[];
  currentRoundParticipations: Participation[];
  userCurrentParticipations: Participation[];
  userYesStake: number;
  userNoStake: number;
  totalUserStake: number;
  timeRemainingSeconds: number;
  totalDurationSeconds: number;
  hasUserParticipated: boolean;
  liveFeed: LiveActivityFeedItem[];
  resolutionSummary: ResolutionSummary | null;
  closeResolutionModal: () => void;
  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  // Actions
  placeStake: (option: MarketOption, stakeAmount: number) => Promise<{ success: boolean; error?: string }>;
  switchUser: (userId: string) => void;
  // Leaderboard & Activity
  getLeaderboard: (timeframe: LeaderboardTimeframe) => LeaderboardEntry[];
  getUserHistory: () => {
    participations: Participation[];
    transactions: Transaction[];
  };
  // Frictionless Profile Management (No Sign Up Needed)
  isProfileConfigured: boolean;
  updateProfile: (username: string, avatar?: string) => Promise<boolean>;
  createNewGuestProfile: () => void;
  restoreGuestProfile: (key: string) => boolean;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

// Device persistent user ID helper
function getOrCreateDeviceId(): string {
  const key = 'guagr_player_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `user_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function getInitialUsername(id: string): string {
  const saved = localStorage.getItem('guagr_player_username');
  if (saved) return saved;
  const suffix = id.slice(-4).toUpperCase();
  return `Trader #${suffix}`;
}

function getInitialAvatar(id: string): string {
  const saved = localStorage.getItem('guagr_player_avatar');
  if (saved) return saved;
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${id}&backgroundColor=0f172a`;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome',
    title: 'Welcome to guagr Multiplayer Beta',
    message: 'Compete in live 90-second recurring prediction markets. You have ₦100,000 beta credits.',
    timestamp: Date.now(),
    read: false,
    type: 'ROUND_START',
  },
];

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string>(() => getOrCreateDeviceId());
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const id = getOrCreateDeviceId();
    return {
      userId: id,
      username: getInitialUsername(id),
      avatar: getInitialAvatar(id),
      virtualBalance: 100000,
      totalProfit: 0,
      totalRounds: 0,
      winningRounds: 0,
    };
  });

  const [isProfileConfigured, setIsProfileConfigured] = useState<boolean>(() => {
    return localStorage.getItem('guagr_profile_configured') === 'true';
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentRound, setCurrentRound] = useState<Market>({
    roundId: 'R-1001',
    roundNumber: 1001,
    startTime: Date.now(),
    endTime: Date.now() + 90000,
    status: 'active',
    yesTotal: 0,
    noTotal: 0,
    totalPot: 0,
    winningOption: null,
    rolloverAmount: 0,
  });

  const [pastRounds, setPastRounds] = useState<Market[]>([]);
  const [userCurrentParticipations, setUserCurrentParticipations] = useState<Participation[]>([]);
  const [userHistory, setUserHistory] = useState<{ participations: Participation[]; transactions: Transaction[] }>({
    participations: [],
    transactions: [],
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [liveFeed, setLiveFeed] = useState<LiveActivityFeedItem[]>([]);
  const [resolutionSummary, setResolutionSummary] = useState<ResolutionSummary | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(90);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('guagr_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_NOTIFICATIONS;
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const saveNotifications = (notifs: AppNotification[]) => {
    setNotifications(notifs);
    try {
      localStorage.setItem('guagr_notifications', JSON.stringify(notifs));
    } catch {
      // safe fallback
    }
  };

  // Fetch Authoritative Server State
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/state?userId=${currentUserId}&username=${encodeURIComponent(currentUser.username)}&avatar=${encodeURIComponent(currentUser.avatar)}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.round) {
        setCurrentRound({
          roundId: data.round.roundId,
          roundNumber: data.round.roundNumber,
          startTime: data.round.startTime,
          endTime: data.round.endTime,
          status: data.round.status,
          yesTotal: data.round.yesTotal,
          noTotal: data.round.noTotal,
          totalPot: data.round.totalPot,
          winningOption: data.round.winningOption || null,
          rolloverAmount: data.round.rolloverAmount || 0,
        });

        const diff = Math.max(0, Math.floor((data.round.endTime - Date.now()) / 1000));
        setTimeRemainingSeconds(diff);
      }

      if (data.user) {
        setCurrentUser(data.user);
      }

      if (data.userCurrentParticipations) {
        setUserCurrentParticipations(data.userCurrentParticipations);
      }

      if (data.userHistory) {
        setUserHistory(data.userHistory);
      }

      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }

      if (data.pastMarkets) {
        setPastRounds(data.pastMarkets);
      }

      if (data.liveFeed) {
        setLiveFeed(data.liveFeed);
      }

      if (data.allUsers) {
        setAllUsers(data.allUsers);
      }
    } catch (err) {
      console.warn('Network sync error:', err);
    }
  }, [currentUserId, currentUser.username, currentUser.avatar]);

  // Initial load & Polling fallback every 2 seconds
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Server-Sent Events (SSE) Real-Time Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/market/events');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'STAKE_PLACED') {
            if (payload.round) {
              setCurrentRound(prev => ({
                ...prev,
                yesTotal: payload.round.yesTotal,
                noTotal: payload.round.noTotal,
                totalPot: payload.round.totalPot,
              }));
            }
            if (payload.feedItem) {
              setLiveFeed(prev => [payload.feedItem, ...prev.slice(0, 19)]);
            }
            if (payload.userId === currentUserId && payload.newBalance !== undefined) {
              setCurrentUser(prev => ({ ...prev, virtualBalance: payload.newBalance }));
            }
          } else if (payload.type === 'ROUND_RESOLVED') {
            const res = payload.resolution;
            fetchState(); // refresh balances and participations

            if (res) {
              const userStat = res.userParticipations?.[currentUserId];
              const userPayout = userStat ? userStat.payout : 0;
              const userStake = userStat ? userStat.stake : 0;
              const netProfit = userStat ? userStat.netProfit : 0;

              setResolutionSummary({
                roundId: res.roundId,
                roundNumber: res.roundNumber,
                winningOption: res.winningOption,
                yesTotal: res.yesTotal,
                noTotal: res.noTotal,
                totalPot: res.totalPot,
                userParticipations: userStat ? [{
                  participationId: `part-${res.roundId}`,
                  userId: currentUserId,
                  roundId: res.roundId,
                  selectedOption: res.winningOption === 'TIE' ? 'YES' : res.winningOption,
                  stake: userStake,
                  payout: userPayout,
                  result: userPayout > 0 ? 'WIN' : res.winningOption === 'TIE' ? 'ROLLOVER' : 'LOSS',
                  timestamp: Date.now(),
                }] : [],
                rolloverAmountNext: res.rolloverAmountNext || 0,
                payout: userPayout,
                netProfit,
              });

              // Notification
              const newNotifs = [...notifications];
              if (userStat) {
                if (userPayout > 0) {
                  newNotifs.unshift({
                    id: `notif-${Date.now()}`,
                    title: `🏆 Round #${res.roundNumber} Won!`,
                    message: `${res.winningOption} won! You earned a payout of ₦${new Intl.NumberFormat('en-US').format(userPayout)}!`,
                    timestamp: Date.now(),
                    read: false,
                    type: 'WIN',
                    roundId: res.roundId,
                  });
                } else if (res.winningOption === 'TIE') {
                  newNotifs.unshift({
                    id: `notif-${Date.now()}`,
                    title: `Round #${res.roundNumber} Rolled Over!`,
                    message: `Equal stakes on YES and NO! ₦${new Intl.NumberFormat('en-US').format(res.totalPot)} rolled over to Round #${res.roundNumber + 1}!`,
                    timestamp: Date.now(),
                    read: false,
                    type: 'ROLLOVER',
                    roundId: res.roundId,
                  });
                } else {
                  newNotifs.unshift({
                    id: `notif-${Date.now()}`,
                    title: `Round #${res.roundNumber} Concluded`,
                    message: `${res.winningOption} won with ₦${new Intl.NumberFormat('en-US').format(res.winningOption === 'YES' ? res.yesTotal : res.noTotal)}.`,
                    timestamp: Date.now(),
                    read: false,
                    type: 'LOSS',
                    roundId: res.roundId,
                  });
                }
              }
              saveNotifications(newNotifs.slice(0, 30));
            }
          }
        } catch {
          // ignore parsing error
        }
      };
    } catch {
      // SSE fallback handled by polling
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentUserId, fetchState, notifications]);

  // Local authoritative timer tick based on currentRound.endTime
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((currentRound.endTime - now) / 1000));
      setTimeRemainingSeconds(diff);
    }, 500);

    return () => clearInterval(timer);
  }, [currentRound.endTime]);

  // User stakes — Supports MULTIPLE stakes in the active 90-second round!
  const placeStake = async (option: MarketOption, stakeAmount: number) => {
    if (stakeAmount <= 0) {
      return { success: false, error: 'Stake must be greater than ₦0.' };
    }
    if (stakeAmount > currentUser.virtualBalance) {
      return { success: false, error: 'Insufficient virtual credits.' };
    }

    try {
      const res = await fetch('/api/market/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          option,
          stakeAmount,
          username: currentUser.username,
          avatar: currentUser.avatar,
        }),
      });

      const result = await res.json();
      if (result.success) {
        // Optimistic UI update
        setCurrentUser(prev => ({ ...prev, virtualBalance: prev.virtualBalance - stakeAmount }));
        const now = Date.now();
        const newNotif: AppNotification = {
          id: `notif-stake-${now}`,
          title: 'Position Confirmed',
          message: `₦${new Intl.NumberFormat('en-US').format(stakeAmount)} staked on ${option} (Round #${currentRound.roundNumber})`,
          timestamp: now,
          read: false,
          type: 'STAKE_CONFIRMED',
          roundId: currentRound.roundId,
        };
        saveNotifications([newNotif, ...notifications.slice(0, 29)]);

        fetchState();
      }
      return result;
    } catch {
      return { success: false, error: 'Failed to place stake. Please check connection.' };
    }
  };

  const switchUser = (newId: string) => {
    localStorage.setItem('guagr_player_id', newId);
    setCurrentUserId(newId);
  };

  const updateProfile = async (username: string, avatar?: string): Promise<boolean> => {
    const cleanName = username.trim().slice(0, 24);
    if (!cleanName) return false;
    const newAvatar = avatar || currentUser.avatar;

    localStorage.setItem('guagr_player_username', cleanName);
    localStorage.setItem('guagr_player_avatar', newAvatar);
    localStorage.setItem('guagr_profile_configured', 'true');
    setIsProfileConfigured(true);

    setCurrentUser(prev => ({ ...prev, username: cleanName, avatar: newAvatar }));

    try {
      await fetch('/api/market/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          username: cleanName,
          avatar: newAvatar,
        }),
      });
      fetchState();
      return true;
    } catch {
      return false;
    }
  };

  const createNewGuestProfile = () => {
    const newId = `user_${Math.random().toString(36).substring(2, 9)}`;
    const newName = `Trader #${newId.slice(-4).toUpperCase()}`;
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${newId}&backgroundColor=0f172a`;

    localStorage.setItem('guagr_player_id', newId);
    localStorage.setItem('guagr_player_username', newName);
    localStorage.setItem('guagr_player_avatar', newAvatar);

    setCurrentUserId(newId);
    setCurrentUser({
      userId: newId,
      username: newName,
      avatar: newAvatar,
      virtualBalance: 100000,
      totalProfit: 0,
      totalRounds: 0,
      winningRounds: 0,
    });
    setUserCurrentParticipations([]);
  };

  const restoreGuestProfile = (secretKey: string): boolean => {
    const cleanKey = secretKey.trim();
    if (!cleanKey || cleanKey.length < 5) return false;

    localStorage.setItem('guagr_player_id', cleanKey);
    setCurrentUserId(cleanKey);
    return true;
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const closeResolutionModal = () => {
    setResolutionSummary(null);
  };

  const userYesStake = userCurrentParticipations
    .filter(p => p.selectedOption === 'YES')
    .reduce((sum, p) => sum + p.stake, 0);

  const userNoStake = userCurrentParticipations
    .filter(p => p.selectedOption === 'NO')
    .reduce((sum, p) => sum + p.stake, 0);

  const totalUserStake = userYesStake + userNoStake;
  const hasUserParticipated = userCurrentParticipations.length > 0;

  const getLeaderboard = (timeframe: LeaderboardTimeframe): LeaderboardEntry[] => {
    return leaderboard;
  };

  const getUserHistory = () => {
    return userHistory;
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <MarketContext.Provider
      value={{
        currentUser,
        allUsers,
        currentRound,
        pastRounds,
        currentRoundParticipations: userCurrentParticipations,
        userCurrentParticipations,
        userYesStake,
        userNoStake,
        totalUserStake,
        timeRemainingSeconds,
        totalDurationSeconds: 90,
        hasUserParticipated,
        liveFeed,
        resolutionSummary,
        closeResolutionModal,
        notifications,
        unreadNotificationsCount,
        markAllNotificationsAsRead,
        clearAllNotifications,
        placeStake,
        switchUser,
        getLeaderboard,
        getUserHistory,
        updateProfile,
        isProfileConfigured,
        createNewGuestProfile,
        restoreGuestProfile,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) throw new Error('useMarket must be used within MarketProvider');
  return context;
};
