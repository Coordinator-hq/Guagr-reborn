import React, { useState } from 'react';
import { useMarket } from '../../context/MarketContext';
import {
  Wallet,
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Edit3,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=NaijaTrader&backgroundColor=0284c7',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ApexWhale&backgroundColor=0f172a',
  'https://api.dicebear.com/7.x/bottts/svg?seed=LagosBull&backgroundColor=16a34a',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoSiren&backgroundColor=9333ea',
  'https://api.dicebear.com/7.x/bottts/svg?seed=AlphaStaker&backgroundColor=ea580c',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja&backgroundColor=e11d48',
];

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    getLeaderboard,
    getUserHistory,
    pastRounds,
    updateProfile,
  } = useMarket();

  const [historyTab, setHistoryTab] = useState<'bets' | 'ledger'>('bets');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempUsername, setTempUsername] = useState<string>(currentUser.username);
  const [tempAvatar, setTempAvatar] = useState<string>(currentUser.avatar);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const { transactions, participations } = getUserHistory();
  const leaderboard = getLeaderboard('all-time');
  const userRankEntry = leaderboard.find(e => e.userId === currentUser.userId);
  const rank = userRankEntry ? userRankEntry.rank : '---';

  const formatCredits = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const winRate =
    currentUser.totalRounds > 0
      ? Math.round((currentUser.winningRounds / currentUser.totalRounds) * 100)
      : 0;

  const handleShuffleAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=0f172a`;
    setTempAvatar(newAvatar);
  };

  const handleSaveProfile = async () => {
    if (!tempUsername.trim()) return;
    setIsSaving(true);
    const ok = await updateProfile(tempUsername.trim(), tempAvatar);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1000);
    }
  };

  return (
    <div className="pb-28 pt-2 text-slate-800">
      {/* Wallet Card Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-[#0062ff] overflow-hidden bg-slate-100 ring-4 ring-blue-50">
                <img
                  src={isEditing ? tempAvatar : currentUser.avatar}
                  alt={currentUser.username}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleShuffleAvatar}
                  title="Shuffle Avatar"
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0062ff] text-white shadow hover:bg-blue-700 transition-transform active:scale-90"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              ) : (
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0062ff] text-white">
                  <Shield className="h-3 w-3" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 truncate">
                  {currentUser.username}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0062ff] border border-blue-200">
                  Player
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>Rank:</span>
                <span className="font-mono font-bold text-slate-800">#{rank}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setTempUsername(currentUser.username);
              setTempAvatar(currentUser.avatar);
            }}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {/* INLINE EDIT PROFILE (Customize Name & Avatar) */}
        {isEditing && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 animate-fade-in">
            <div className="text-xs font-bold text-slate-700 mb-2">
              Edit Player Name & Avatar
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={tempUsername}
                  onChange={e => setTempUsername(e.target.value)}
                  placeholder="e.g. ApexTrader, NaijaWhale"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-[#0062ff] focus:outline-none"
                />
              </div>

              {/* Preset Avatars */}
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1.5">
                  Choose Avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTempAvatar(av)}
                      className={`h-11 w-11 rounded-xl overflow-hidden shrink-0 border-2 transition-transform active:scale-95 ${
                        tempAvatar === av
                          ? 'border-[#0062ff] ring-2 ring-blue-200 scale-105'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={av} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleShuffleAvatar}
                    title="Generate Random"
                    className="h-11 w-11 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center shrink-0 hover:bg-slate-50 text-slate-500 active:scale-95"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-[8px] font-bold mt-0.5">Random</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving || !tempUsername.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0062ff] px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Balance Display */}
        <div className="mt-5 rounded-2xl bg-gradient-to-tr from-slate-900 to-[#1e293b] p-4 text-white shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-medium">
              <Wallet className="h-4 w-4 text-cyan-400" />
              <span>Virtual Wallet Balance</span>
            </div>
            <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
              guagr Beta
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="font-mono text-3xl font-black tabular-nums tracking-tight text-white">
              ₦{formatCredits(currentUser.virtualBalance)}
            </div>
            <span className="font-mono text-xs font-semibold text-cyan-400">
              AVAILABLE
            </span>
          </div>

          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-2">
            Virtual beta credits for prediction markets. No real-money transactions.
          </div>
        </div>
      </div>

      {/* Numerical Stats Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {/* Total Profit / Loss */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            {currentUser.totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-600" />
            )}
            <span>Total PnL</span>
          </div>
          <div
            className={`mt-1 font-mono text-lg font-black tabular-nums ${
              currentUser.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {currentUser.totalProfit >= 0
              ? `+₦${formatCredits(currentUser.totalProfit)}`
              : `₦${formatCredits(currentUser.totalProfit)}`}
          </div>
        </div>

        {/* Win Rate */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Target className="h-4 w-4 text-amber-500" />
            <span>Win Rate</span>
          </div>
          <div className="mt-1 font-mono text-lg font-black text-slate-900 tabular-nums">
            {winRate}%
          </div>
        </div>

        {/* Total Rounds Played */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Rounds</div>
          <div className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
            {currentUser.totalRounds}
          </div>
        </div>

        {/* Winning Rounds */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Winning Rounds</div>
          <div className="mt-1 font-mono text-lg font-bold text-emerald-600 tabular-nums">
            {currentUser.winningRounds}
          </div>
        </div>
      </div>

      {/* Profile History Section (Bets vs Ledger) */}
      <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        {/* Toggle between Bets and Ledger */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-3">
          <button
            onClick={() => setHistoryTab('bets')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              historyTab === 'bets'
                ? 'bg-white text-[#0062ff] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Past Bets ({participations.length})
          </button>
          <button
            onClick={() => setHistoryTab('ledger')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              historyTab === 'ledger'
                ? 'bg-white text-[#0062ff] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Wallet Ledger ({transactions.length})
          </button>
        </div>

        {historyTab === 'bets' ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {participations.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No bets placed yet. Take a position in the active 90-second market.
              </div>
            ) : (
              participations.map(p => {
                const roundData = pastRounds.find(r => r.roundId === p.roundId);
                const winningOpt = roundData?.winningOption || (p.result === 'WIN' ? p.selectedOption : '---');
                const netProfit = p.result === 'WIN' ? p.payout - p.stake : -p.stake;

                return (
                  <div
                    key={p.participationId}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700">
                        <span>{p.roundId}</span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={
                            p.selectedOption === 'YES' ? 'text-[#0062ff]' : 'text-[#e11d48]'
                          }
                        >
                          {p.selectedOption}
                        </span>
                      </div>

                      <div>
                        {p.result === 'WIN' ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 text-[11px] font-bold">
                            +₦{formatCredits(netProfit)}
                          </span>
                        ) : p.result === 'LOSS' ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700 text-[11px] font-bold">
                            -₦{formatCredits(p.stake)}
                          </span>
                        ) : p.result === 'ROLLOVER' ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 text-[11px] font-bold">
                            Rollover
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold text-[11px]">Pending</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Stake: ₦{formatCredits(p.stake)}</span>
                      <span>Winner: {winningOpt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {transactions.map(tx => (
              <div
                key={tx.transactionId}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {tx.amount >= 0 ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 shrink-0">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 truncate">{tx.description}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div
                  className={`font-mono font-bold tabular-nums shrink-0 ml-2 ${
                    tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {tx.amount >= 0 ? `+₦${formatCredits(tx.amount)}` : `₦${formatCredits(tx.amount)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
