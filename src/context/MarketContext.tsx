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

// Synchronized 90-second global clock window
function getClockRound(now: number) {
  const windowIndex = Math.floor(now / 90000);
  const roundNumber = 1000 + (windowIndex % 10000);
  const startTime = windowIndex * 90000;
  const endTime = startTime + 90000;
  const roundId = `R-${roundNumber}`;
  return { windowIndex, roundNumber, startTime, endTime, roundId };
}

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

export const BOT_TRADERS = [
  { userId: 'bot_whale_delta', username: 'WhaleDelta', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WhaleDelta&backgroundColor=1e293b', totalProfit: 145000, virtualBalance: 345000, totalRounds: 38, winningRounds: 25 },
  { userId: 'bot_apex_scalper', username: 'ApexScalper', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexScalper&backgroundColor=0f172a', totalProfit: 118000, virtualBalance: 318000, totalRounds: 36, winningRounds: 23 },
  { userId: 'bot_quant_alpha', username: 'QuantAlpha', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantAlpha&backgroundColor=022c22', totalProfit: 95000, virtualBalance: 295000, totalRounds: 32, winningRounds: 21 },
  { userId: 'bot_eko_whale', username: 'EkoWhale', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=EkoWhale&backgroundColor=0369a1', totalProfit: 78000, virtualBalance: 278000, totalRounds: 30, winningRounds: 19 },
  { userId: 'bot_lagos_trader', username: 'LagosTrader', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LagosTrader&backgroundColor=172554', totalProfit: 62000, virtualBalance: 262000, totalRounds: 28, winningRounds: 18 },
  { userId: 'bot_satoshi_pulse', username: 'SatoshiPulse', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SatoshiPulse&backgroundColor=451a03', totalProfit: 48000, virtualBalance: 248000, totalRounds: 26, winningRounds: 16 },
  { userId: 'bot_abuja_trader', username: 'AbujaTrader', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AbujaTrader&backgroundColor=047857', totalProfit: 36000, virtualBalance: 236000, totalRounds: 25, winningRounds: 15 },
  { userId: 'bot_naija_bull', username: 'NaijaBull', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NaijaBull&backgroundColor=3b0764', totalProfit: 28000, virtualBalance: 228000, totalRounds: 22, winningRounds: 13 },
  { userId: 'bot_sigma_hedger', username: 'SigmaHedger', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SigmaHedger&backgroundColor=6d28d9', totalProfit: 21000, virtualBalance: 221000, totalRounds: 20, winningRounds: 12 },
  { userId: 'bot_kano_delta', username: 'DeltaKano', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DeltaKano&backgroundColor=134e4a', totalProfit: 15000, virtualBalance: 215000, totalRounds: 18, winningRounds: 10 },
  { userId: 'bot_ph_whale', username: 'PortHarcourtWhale', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PortHarcourtWhale&backgroundColor=0e7490', totalProfit: 11000, virtualBalance: 211000, totalRounds: 17, winningRounds: 9 },
  { userId: 'bot_calabar_alpha', username: 'CalabarAlpha', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CalabarAlpha&backgroundColor=15803d', totalProfit: 6000, virtualBalance: 206000, totalRounds: 16, winningRounds: 8 },
  { userId: 'bot_enugu_scalper', username: 'EnuguScalper', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=EnuguScalper&backgroundColor=a16207', totalProfit: 2000, virtualBalance: 202000, totalRounds: 14, winningRounds: 7 },
  { userId: 'bot_benin_pulse', username: 'BeninPulse', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=BeninPulse&backgroundColor=431407', totalProfit: -3000, virtualBalance: 197000, totalRounds: 15, winningRounds: 6 },
  { userId: 'bot_zaria_alpha', username: 'ZariaAlpha', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ZariaAlpha&backgroundColor=b91c1c', totalProfit: -8000, virtualBalance: 192000, totalRounds: 16, winningRounds: 7 },
  { userId: 'bot_ibadan_bull', username: 'IbadanBull', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=IbadanBull&backgroundColor=c2410c', totalProfit: -14000, virtualBalance: 186000, totalRounds: 15, winningRounds: 5 },
  { userId: 'bot_asaba_trader', username: 'AsabaTrader', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AsabaTrader&backgroundColor=0f766e', totalProfit: -22000, virtualBalance: 178000, totalRounds: 18, winningRounds: 6 },
  { userId: 'bot_jos_hedger', username: 'JosHedger', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=JosHedger&backgroundColor=4338ca', totalProfit: -31000, virtualBalance: 169000, totalRounds: 19, winningRounds: 5 },
  { userId: 'bot_kaduna_bull', username: 'KadunaBull', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KadunaBull&backgroundColor=701a75', totalProfit: -42000, virtualBalance: 158000, totalRounds: 22, winningRounds: 6 },
  { userId: 'bot_owerri_alpha', username: 'OwerriAlpha', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=OwerriAlpha&backgroundColor=831843', totalProfit: -55000, virtualBalance: 145000, totalRounds: 24, winningRounds: 5 },
];

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string>(() => getOrCreateDeviceId());
  
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const id = getOrCreateDeviceId();
    const savedBal = localStorage.getItem('guagr_player_balance');
    const bal = savedBal !== null ? parseInt(savedBal, 10) : 100000;
    return {
      userId: id,
      username: getInitialUsername(id),
      avatar: getInitialAvatar(id),
      virtualBalance: isNaN(bal) ? 100000 : bal,
      totalProfit: parseInt(localStorage.getItem('guagr_player_profit') || '0', 10),
      totalRounds: parseInt(localStorage.getItem('guagr_player_rounds') || '0', 10),
      winningRounds: parseInt(localStorage.getItem('guagr_player_wins') || '0', 10),
    };
  });

  const [isProfileConfigured, setIsProfileConfigured] = useState<boolean>(() => {
    return localStorage.getItem('guagr_profile_configured') === 'true';
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const initialClock = getClockRound(Date.now());
  const [currentRound, setCurrentRound] = useState<Market>({
    roundId: initialClock.roundId,
    roundNumber: initialClock.roundNumber,
    startTime: initialClock.startTime,
    endTime: initialClock.endTime,
    status: 'active',
    yesTotal: 18000,
    noTotal: 22000,
    totalPot: 40000,
    winningOption: null,
    rolloverAmount: 0,
  });

  const currentRoundRef = useRef<Market>(currentRound);
  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  const [pastRounds, setPastRounds] = useState<Market[]>([]);
  const [userCurrentParticipations, setUserCurrentParticipations] = useState<Participation[]>([]);
  const userCurrentParticipationsRef = useRef<Participation[]>(userCurrentParticipations);
  useEffect(() => {
    userCurrentParticipationsRef.current = userCurrentParticipations;
  }, [userCurrentParticipations]);

  const [userHistory, setUserHistory] = useState<{ participations: Participation[]; transactions: Transaction[] }>({
    participations: [],
    transactions: [],
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [liveFeed, setLiveFeed] = useState<LiveActivityFeedItem[]>([
    {
      id: 'feed-init-1',
      username: 'WhaleDelta',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WhaleDelta&backgroundColor=1e293b',
      option: 'YES',
      stake: 18000,
      timestamp: Date.now() - 12000,
    },
    {
      id: 'feed-init-2',
      username: 'LagosTrader',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LagosTrader&backgroundColor=172554',
      option: 'NO',
      stake: 22000,
      timestamp: Date.now() - 25000,
    },
  ]);
  const [resolutionSummary, setResolutionSummary] = useState<ResolutionSummary | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(() => {
    return Math.max(0, Math.floor((initialClock.endTime - Date.now()) / 1000));
  });

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

  const notificationsRef = useRef<AppNotification[]>(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Track if backend Express server is accessible
  const isServerAvailable = useRef<boolean>(false);

  const saveNotifications = (notifs: AppNotification[]) => {
    setNotifications(notifs);
    try {
      localStorage.setItem('guagr_notifications', JSON.stringify(notifs));
    } catch {
      // safe fallback
    }
  };

  // Fetch Authoritative Server State (if server is running)
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/state?userId=${currentUserId}&username=${encodeURIComponent(currentUser.username)}&avatar=${encodeURIComponent(currentUser.avatar)}`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        isServerAvailable.current = false;
        return;
      }
      const data = await res.json();
      isServerAvailable.current = true;

      if (data.round) {
        setCurrentRound(prev => {
          if (
            prev.roundId === data.round.roundId &&
            prev.yesTotal === data.round.yesTotal &&
            prev.noTotal === data.round.noTotal &&
            prev.status === data.round.status &&
            Math.abs(prev.endTime - data.round.endTime) < 2000
          ) {
            return prev;
          }
          return {
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
          };
        });
      }

      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('guagr_player_balance', data.user.virtualBalance.toString());
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
    } catch {
      // Server is not present (e.g. Vercel static deployment)
      isServerAvailable.current = false;
    }
  }, [currentUserId, currentUser.username, currentUser.avatar]);

  // Initial load & Polling fallback every 2.5 seconds
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2500);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Server-Sent Events (SSE) Real-Time Stream (only when server available)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/market/events');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          isServerAvailable.current = true;

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
              localStorage.setItem('guagr_player_balance', payload.newBalance.toString());
            }
          } else if (payload.type === 'ROUND_RESOLVED') {
            const res = payload.resolution;
            fetchState();

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
            }
          }
        } catch {
          // ignore parsing error
        }
      };
    } catch {
      // SSE not supported on this host
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentUserId, fetchState]);

  // Synchronized Engine Tick & Round Resolution Loop (Handles Vercel / Offline seamlessly)
  useEffect(() => {
    const timer = setInterval(() => {
      const round = currentRoundRef.current;
      if (!round) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.floor((round.endTime - now) / 1000));

      setTimeRemainingSeconds(remaining);

      // Trigger round resolution when current round's timer expires
      if (!isServerAvailable.current && remaining <= 0 && round.status === 'active') {
        const prevRound = round;
        let winningOption: MarketOption | 'TIE' = 'TIE';
        if (prevRound.yesTotal > prevRound.noTotal) winningOption = 'YES';
        else if (prevRound.noTotal > prevRound.yesTotal) winningOption = 'NO';

        const userParts = userCurrentParticipationsRef.current;

        // Calculate payout if user participated
        const userWinningStake = userParts
          .filter(p => p.selectedOption === winningOption)
          .reduce((sum, p) => sum + p.stake, 0);
        const userTotalStaked = userParts
          .reduce((sum, p) => sum + p.stake, 0);
        const winningSideTotal = winningOption === 'YES' ? prevRound.yesTotal : prevRound.noTotal;

        let userPayout = 0;
        let netProfit = 0;
        if (winningOption !== 'TIE' && userWinningStake > 0 && winningSideTotal > 0) {
          userPayout = Math.floor((userWinningStake / winningSideTotal) * prevRound.totalPot);
          netProfit = userPayout - userTotalStaked;
        }

        // Apply payout and persist stats
        if (userTotalStaked > 0) {
          setCurrentUser(prev => {
            const updatedBal = prev.virtualBalance + userPayout;
            const updatedWins = userPayout > 0 ? prev.winningRounds + 1 : prev.winningRounds;
            const updatedRounds = prev.totalRounds + 1;
            const updatedProfit = prev.totalProfit + netProfit;

            localStorage.setItem('guagr_player_balance', updatedBal.toString());
            localStorage.setItem('guagr_player_wins', updatedWins.toString());
            localStorage.setItem('guagr_player_rounds', updatedRounds.toString());
            localStorage.setItem('guagr_player_profit', updatedProfit.toString());

            return {
              ...prev,
              virtualBalance: updatedBal,
              winningRounds: updatedWins,
              totalRounds: updatedRounds,
              totalProfit: updatedProfit,
            };
          });

          // Show resolution modal
          setResolutionSummary({
            roundId: prevRound.roundId,
            roundNumber: prevRound.roundNumber,
            winningOption,
            yesTotal: prevRound.yesTotal,
            noTotal: prevRound.noTotal,
            totalPot: prevRound.totalPot,
            userParticipations: userParts.map(p => ({
              ...p,
              result: winningOption === 'TIE' ? 'ROLLOVER' : p.selectedOption === winningOption ? 'WIN' : 'LOSS',
              payout: p.selectedOption === winningOption ? userPayout : 0,
            })),
            rolloverAmountNext: winningOption === 'TIE' ? prevRound.totalPot : 0,
            payout: userPayout,
            netProfit,
          });

          // Add notification
          const newNotif: AppNotification = {
            id: `notif-${now}`,
            title: userPayout > 0 ? `🏆 Round #${prevRound.roundNumber} Won!` : `Round #${prevRound.roundNumber} Concluded`,
            message: userPayout > 0
              ? `${winningOption} won! You earned a payout of ₦${new Intl.NumberFormat('en-US').format(userPayout)}!`
              : `${winningOption} won with ₦${new Intl.NumberFormat('en-US').format(winningSideTotal)}. Better luck next round!`,
            timestamp: now,
            read: false,
            type: userPayout > 0 ? 'WIN' : 'LOSS',
            roundId: prevRound.roundId,
          };
          saveNotifications([newNotif, ...notificationsRef.current.slice(0, 29)]);
        }

        // Reset user stakes for new round
        setUserCurrentParticipations([]);

        // Create new 90-second round starting now
        const nextRoundNumber = prevRound.roundNumber + 1;
        const seedYes = 24000 + Math.floor(Math.random() * 20000);
        const seedNo = 22000 + Math.floor(Math.random() * 22000);
        const rollover = winningOption === 'TIE' ? prevRound.totalPot : 0;

        setCurrentRound({
          roundId: `R-${nextRoundNumber}`,
          roundNumber: nextRoundNumber,
          startTime: now,
          endTime: now + 90000,
          status: 'active',
          yesTotal: seedYes,
          noTotal: seedNo,
          totalPot: seedYes + seedNo + rollover,
          winningOption: null,
          rolloverAmount: rollover,
        });

        setPastRounds(prev => [
          { ...prevRound, status: 'resolved', winningOption, resolvedAt: now },
          ...prev.slice(0, 9),
        ]);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Organic simulated background bets for dynamic orderbook on Vercel & Standalone (FAST: 1000ms)
  useEffect(() => {
    const botInterval = setInterval(() => {
      if (isServerAvailable.current) return;
      const round = currentRoundRef.current;
      if (!round || round.status !== 'active') return;

      const remainingSecs = Math.max(0, Math.floor((round.endTime - Date.now()) / 1000));
      if (remainingSecs <= 3) return; // Freeze bets in final 3 seconds before resolution

      // Fast activity: 1-2 bot stakes every 1.0 second
      const count = Math.random() > 0.35 ? 2 : 1;
      const now = Date.now();

      let addedYes = 0;
      let addedNo = 0;
      const newFeedItems: LiveActivityFeedItem[] = [];

      for (let i = 0; i < count; i++) {
        const randomBot = BOT_TRADERS[Math.floor(Math.random() * BOT_TRADERS.length)];
        const randomOption: MarketOption = Math.random() > 0.48 ? 'YES' : 'NO';
        const stakeAmounts = [1000, 2500, 5000, 10000, 15000, 25000];
        const botStake = stakeAmounts[Math.floor(Math.random() * stakeAmounts.length)];

        if (randomOption === 'YES') addedYes += botStake;
        else addedNo += botStake;

        newFeedItems.unshift({
          id: `feed-bot-${now}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          username: randomBot.username,
          avatar: randomBot.avatar,
          option: randomOption,
          stake: botStake,
          timestamp: now,
        });
      }

      setCurrentRound(prev => {
        const yesTotal = prev.yesTotal + addedYes;
        const noTotal = prev.noTotal + addedNo;
        return {
          ...prev,
          yesTotal,
          noTotal,
          totalPot: yesTotal + noTotal + (prev.rolloverAmount || 0),
        };
      });

      setLiveFeed(prev => [...newFeedItems, ...prev.slice(0, 19)]);
    }, 1000);

    return () => clearInterval(botInterval);
  }, []);

  // User stakes — Supports MULTIPLE stakes on committed option in active 90-second round!
  const placeStake = async (option: MarketOption, stakeAmount: number): Promise<{ success: boolean; error?: string }> => {
    if (stakeAmount <= 0) {
      return { success: false, error: 'Stake must be greater than ₦0.' };
    }
    if (stakeAmount > currentUser.virtualBalance) {
      return { success: false, error: 'Insufficient virtual credits.' };
    }

    // Check if user has already committed to an option in the current round
    const existingParticipation = userCurrentParticipations.find(p => p.roundId === currentRound.roundId);
    if (existingParticipation && existingParticipation.selectedOption !== option) {
      return {
        success: false,
        error: `Your position is locked to ${existingParticipation.selectedOption} for Round #${currentRound.roundNumber}.`,
      };
    }

    // Attempt Server API if available
    if (isServerAvailable.current) {
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

        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            const newBal = currentUser.virtualBalance - stakeAmount;
            localStorage.setItem('guagr_player_balance', newBal.toString());
            setCurrentUser(prev => ({ ...prev, virtualBalance: newBal }));

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
            return result;
          }
        }
      } catch {
        // Fall back to standalone client execution below
        isServerAvailable.current = false;
      }
    }

    // Standalone Execution (Vercel / Static / Offline) — Guaranteed 100% Success!
    const newBal = currentUser.virtualBalance - stakeAmount;
    localStorage.setItem('guagr_player_balance', newBal.toString());
    setCurrentUser(prev => ({ ...prev, virtualBalance: newBal }));

    const now = Date.now();
    const newParticipation: Participation = {
      participationId: `part-${now}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUserId,
      roundId: currentRound.roundId,
      selectedOption: option,
      stake: stakeAmount,
      payout: 0,
      result: 'PENDING',
      timestamp: now,
      username: currentUser.username,
      avatar: currentUser.avatar,
    };

    setUserCurrentParticipations(prev => [...prev, newParticipation]);

    setCurrentRound(prev => {
      const yesTotal = option === 'YES' ? prev.yesTotal + stakeAmount : prev.yesTotal;
      const noTotal = option === 'NO' ? prev.noTotal + stakeAmount : prev.noTotal;
      return {
        ...prev,
        yesTotal,
        noTotal,
        totalPot: yesTotal + noTotal,
      };
    });

    const newTx: Transaction = {
      transactionId: `tx-${now}`,
      userId: currentUserId,
      amount: -stakeAmount,
      type: 'STAKE',
      roundId: currentRound.roundId,
      timestamp: now,
      description: `Staked ₦${new Intl.NumberFormat('en-US').format(stakeAmount)} on ${option}`,
    };

    setUserHistory(prev => ({
      participations: [newParticipation, ...prev.participations],
      transactions: [newTx, ...prev.transactions],
    }));

    const feedItem: LiveActivityFeedItem = {
      id: `feed-${now}`,
      username: currentUser.username,
      avatar: currentUser.avatar,
      option,
      stake: stakeAmount,
      timestamp: now,
    };
    setLiveFeed(prev => [feedItem, ...prev.slice(0, 19)]);

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

    return { success: true };
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

    if (isServerAvailable.current) {
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
      } catch {
        // Fallback already saved in state
      }
    }
    return true;
  };

  const createNewGuestProfile = () => {
    const newId = `user_${Math.random().toString(36).substring(2, 9)}`;
    const newName = `Trader #${newId.slice(-4).toUpperCase()}`;
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${newId}&backgroundColor=0f172a`;

    localStorage.setItem('guagr_player_id', newId);
    localStorage.setItem('guagr_player_username', newName);
    localStorage.setItem('guagr_player_avatar', newAvatar);
    localStorage.setItem('guagr_player_balance', '100000');
    localStorage.setItem('guagr_player_wins', '0');
    localStorage.setItem('guagr_player_rounds', '0');
    localStorage.setItem('guagr_player_profit', '0');

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

  const getLeaderboard = (_timeframe: LeaderboardTimeframe): LeaderboardEntry[] => {
    if (leaderboard.length > 0) return leaderboard;

    const entriesMap = new Map<string, LeaderboardEntry>();

    // Faithfully populate all 20 participant bots
    BOT_TRADERS.forEach(b => {
      entriesMap.set(b.userId, {
        rank: 0,
        userId: b.userId,
        username: b.username,
        avatar: b.avatar,
        virtualBalance: b.virtualBalance,
        totalProfit: b.totalProfit,
        winningRounds: b.winningRounds,
        totalRounds: b.totalRounds,
        winRate: Math.round((b.winningRounds / b.totalRounds) * 100),
        isCurrentUser: false,
      });
    });

    // Add current player's live performance
    entriesMap.set(currentUser.userId, {
      rank: 0,
      userId: currentUser.userId,
      username: currentUser.username,
      avatar: currentUser.avatar,
      virtualBalance: currentUser.virtualBalance,
      totalProfit: currentUser.totalProfit,
      winningRounds: currentUser.winningRounds,
      totalRounds: currentUser.totalRounds,
      winRate: currentUser.totalRounds > 0 ? Math.round((currentUser.winningRounds / currentUser.totalRounds) * 100) : 0,
      isCurrentUser: true,
    });

    // Add any peer players
    allUsers.forEach(u => {
      if (u.userId !== currentUser.userId && !entriesMap.has(u.userId)) {
        entriesMap.set(u.userId, {
          rank: 0,
          userId: u.userId,
          username: u.username,
          avatar: u.avatar,
          virtualBalance: u.virtualBalance,
          totalProfit: u.totalProfit,
          winningRounds: u.winningRounds,
          totalRounds: u.totalRounds,
          winRate: u.totalRounds > 0 ? Math.round((u.winningRounds / u.totalRounds) * 100) : 0,
          isCurrentUser: false,
        });
      }
    });

    return Array.from(entriesMap.values())
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
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
