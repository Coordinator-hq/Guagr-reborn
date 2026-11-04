import React, { useState } from 'react';
import { useMarket } from '../../context/MarketContext';
import { MarketOption } from '../../types/market';
import {
  Bookmark,
  Clock,
  Lock,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Layers,
  Plus,
  Sparkles,
  RefreshCw,
  User,
  X,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=NaijaTrader&backgroundColor=0284c7',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ApexWhale&backgroundColor=0f172a',
  'https://api.dicebear.com/7.x/bottts/svg?seed=NaijaCap&backgroundColor=16a34a',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoSiren&backgroundColor=9333ea',
  'https://api.dicebear.com/7.x/bottts/svg?seed=AlphaStaker&backgroundColor=ea580c',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja&backgroundColor=e11d48',
];

export const MarketScreen: React.FC = () => {
  const {
    currentUser,
    currentRound,
    pastRounds,
    hasUserParticipated,
    userYesStake,
    userNoStake,
    placeStake,
    updateProfile,
    isProfileConfigured,
    timeRemainingSeconds,
    liveFeed,
  } = useMarket();

  const [selectedOption, setSelectedOption] = useState<MarketOption | null>('YES');
  const [stakeAmount, setStakeAmount] = useState<number>(1000);
  const [inputVal, setInputVal] = useState<string>('1000');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Profile setup modal state when user attempts to stake for the first time
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileUsername, setProfileUsername] = useState<string>(() => {
    return currentUser.username.startsWith('Trader #') ? '' : currentUser.username;
  });
  const [profileAvatar, setProfileAvatar] = useState<string>(() => currentUser.avatar || PRESET_AVATARS[0]);
  const [profileError, setProfileError] = useState<string | null>(null);

  const formatCredits = (num: number) => new Intl.NumberFormat('en-US').format(num);

  // Countdown timer directly starting from 90 seconds
  const timerFormatted = `${timeRemainingSeconds}s`;

  // Calculations for distribution
  const yesTotal = currentRound?.yesTotal || 0;
  const noTotal = currentRound?.noTotal || 0;
  const rollover = currentRound?.rolloverAmount || 0;
  const totalWagered = yesTotal + noTotal;
  const totalPot = currentRound?.totalPot || (totalWagered + rollover);

  const yesPercent = totalWagered > 0 ? Math.round((yesTotal / totalWagered) * 100) : 50;
  const noPercent = totalWagered > 0 ? 100 - yesPercent : 50;

  // Calculate user's estimated payout.
  // CRITICAL: If the user's chosen side is losing, no estimated payout is shown!
  const getUserEstPayout = () => {
    let totalEst = 0;
    // If user staked YES and YES is currently winning
    if (userYesStake > 0 && yesTotal > noTotal && yesTotal > 0) {
      totalEst += Math.round((userYesStake / yesTotal) * (totalPot * 0.90));
    }
    // If user staked NO and NO is currently winning
    if (userNoStake > 0 && noTotal > yesTotal && noTotal > 0) {
      totalEst += Math.round((userNoStake / noTotal) * (totalPot * 0.90));
    }
    return totalEst;
  };

  const estPayoutAmount = getUserEstPayout();

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputVal(raw);
    const parsed = parseInt(raw, 10) || 0;
    setStakeAmount(parsed);
    setErrorMessage(null);
  };

  const handleSetStake = (amount: number) => {
    const capped = Math.min(amount, currentUser.virtualBalance);
    setStakeAmount(capped);
    setInputVal(String(capped));
    setErrorMessage(null);
  };

  const handlePercentageStake = (percent: number) => {
    const calculated = Math.floor((currentUser.virtualBalance * percent) / 100);
    const safe = Math.max(100, calculated);
    setStakeAmount(safe);
    setInputVal(String(safe));
    setErrorMessage(null);
  };

  const executeStake = async (option: MarketOption, amount: number) => {
    setIsSubmitting(true);
    try {
      const res = await placeStake(option, amount);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to confirm stake.');
      } else {
        setErrorMessage(null);
      }
    } catch {
      setErrorMessage('Network error placing stake.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmStake = async () => {
    if (!selectedOption) {
      setErrorMessage('Please select either YES or NO.');
      return;
    }
    if (stakeAmount <= 0) {
      setErrorMessage('Stake amount must be greater than ₦0.');
      return;
    }
    if (stakeAmount > currentUser.virtualBalance) {
      setErrorMessage('Stake exceeds your current virtual balance.');
      return;
    }

    // Intercept: If profile not configured yet, prompt player to set their name and choose avatar
    if (!isProfileConfigured) {
      setProfileUsername(currentUser.username.startsWith('Trader #') ? '' : currentUser.username);
      setProfileAvatar(currentUser.avatar || PRESET_AVATARS[0]);
      setProfileError(null);
      setShowProfileModal(true);
      return;
    }

    await executeStake(selectedOption, stakeAmount);
  };

  const handleShuffleProfileAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=0f172a`;
    setProfileAvatar(newAvatar);
  };

  const handleSaveProfileAndStake = async () => {
    const trimmed = profileUsername.trim();
    if (!trimmed) {
      setProfileError('Please enter a player name.');
      return;
    }
    if (trimmed.length < 2) {
      setProfileError('Player name must be at least 2 characters.');
      return;
    }

    setProfileError(null);
    setShowProfileModal(false);

    // Save profile name and avatar to device & server
    await updateProfile(trimmed, profileAvatar);

    // Immediately execute the attempted stake
    if (selectedOption && stakeAmount > 0) {
      await executeStake(selectedOption, stakeAmount);
    }
  };

  // Option locked once the user takes a position in the current round
  const lockedOption: MarketOption | null =
    userYesStake > 0
      ? 'YES'
      : userNoStake > 0
      ? 'NO'
      : null;

  // Auto-sync selectedOption if locked
  React.useEffect(() => {
    if (lockedOption) {
      setSelectedOption(lockedOption);
    }
  }, [lockedOption]);

  const isLowTime = timeRemainingSeconds <= 15;

  return (
    <div className="pb-28 pt-2 text-slate-800">
      {/* PRIMARY 90-SECOND RECURRING MARKET CARD */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
        {/* Top Header Row of Card (Highlighted areas removed per instructions) */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider font-mono">
              ROUND #{currentRound?.roundNumber || '1048'}
            </span>
            {rollover > 0 && (
              <span className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                <Layers className="h-3 w-3" />
                Rollover ₦{formatCredits(rollover)}
              </span>
            )}
          </div>

          <h1 className="mt-1 text-base sm:text-lg font-bold text-[#0f172a] leading-snug">
            Which option will attract the most money?
          </h1>
        </div>

        {/* TWO SELECTION BUTTONS: BUY YES / BUY NO */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Buy YES Box */}
          <button
            onClick={() => {
              if (lockedOption === 'NO') {
                setErrorMessage(`Your position is locked to NO for Round #${currentRound?.roundNumber}.`);
                return;
              }
              setSelectedOption('YES');
              setErrorMessage(null);
            }}
            disabled={lockedOption === 'NO'}
            className={`rounded-xl border py-3.5 px-4 text-center font-bold text-sm transition-all ${
              selectedOption === 'YES'
                ? 'bg-[#0062ff] text-white border-[#0062ff] shadow-md shadow-blue-500/20 scale-[1.02]'
                : lockedOption === 'NO'
                ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                : 'bg-[#f0f7ff] border-[#cce4ff] text-[#0062ff] hover:bg-[#e5f2ff]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span>Buy Yes</span>
              {lockedOption === 'YES' && (
                <span className="text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                  LOCKED
                </span>
              )}
            </div>
          </button>

          {/* Buy NO Box */}
          <button
            onClick={() => {
              if (lockedOption === 'YES') {
                setErrorMessage(`Your position is locked to YES for Round #${currentRound?.roundNumber}.`);
                return;
              }
              setSelectedOption('NO');
              setErrorMessage(null);
            }}
            disabled={lockedOption === 'YES'}
            className={`rounded-xl border py-3.5 px-4 text-center font-bold text-sm transition-all ${
              selectedOption === 'NO'
                ? 'bg-[#e11d48] text-white border-[#e11d48] shadow-md shadow-rose-500/20 scale-[1.02]'
                : lockedOption === 'YES'
                ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                : 'bg-[#fff1f3] border-[#ffd2d8] text-[#e11d48] hover:bg-[#ffe4e8]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span>Buy No</span>
              {lockedOption === 'NO' && (
                <span className="text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                  LOCKED
                </span>
              )}
            </div>
          </button>
        </div>

        {/* CARD FOOTER: Recurring 90-second window & Countdown Timer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="font-medium text-slate-400">90-Second Window</span>

          {/* Countdown Timer with Bookmark */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-semibold text-emerald-600 font-mono">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span className={isLowTime ? 'text-rose-600 animate-pulse font-bold' : ''}>
                Ends in {timerFormatted}
              </span>
            </div>
            <Bookmark className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
          </div>
        </div>

        {/* LIVE DISTRIBUTION (Revealed after initial stake) */}
        {hasUserParticipated && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-[#f7faff] p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#0062ff]" />
                <div>
                  <div className="text-[11px] font-semibold uppercase text-slate-400">
                    Your Total Position
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {userYesStake > 0 && (
                      <span className="text-[#0062ff] mr-2">
                        YES: ₦{formatCredits(userYesStake)}
                      </span>
                    )}
                    {userNoStake > 0 && (
                      <span className="text-rose-600">
                        NO: ₦{formatCredits(userNoStake)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-semibold text-slate-400">Est. Payout</div>
                {estPayoutAmount > 0 ? (
                  <div className="font-mono text-sm font-bold text-emerald-600">
                    ~₦{formatCredits(estPayoutAmount)}
                  </div>
                ) : (
                  <div className="font-mono text-sm font-bold text-slate-400">
                    ₦0
                  </div>
                )}
              </div>
            </div>

            {/* Live Distribution Progress Bar */}
            <div className="mt-3.5">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-[#0062ff]">YES {yesPercent}% (₦{formatCredits(yesTotal)})</span>
                <span className="text-[#e11d48]">NO {noPercent}% (₦{formatCredits(noTotal)})</span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 flex">
                <div
                  className="bg-[#0062ff] transition-all duration-500 ease-out flex items-center justify-start pl-1 text-[9px] font-bold text-white"
                  style={{ width: `${yesPercent}%` }}
                />
                <div
                  className="bg-[#e11d48] transition-all duration-500 ease-out flex items-center justify-end pr-1 text-[9px] font-bold text-white"
                  style={{ width: `${noPercent}%` }}
                />
              </div>

              <div className="mt-2 text-center text-[11px] font-semibold text-slate-600">
                {yesTotal > noTotal ? (
                  <span>YES currently leading by ₦{formatCredits(yesTotal - noTotal)}</span>
                ) : noTotal > yesTotal ? (
                  <span>NO currently leading by ₦{formatCredits(noTotal - yesTotal)}</span>
                ) : (
                  <span className="text-amber-600">Equal wagers — 100% of pot will roll over!</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STAKE CONTROLS: POSITIONED ABOVE RECENT LIVE STAKES */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          {!hasUserParticipated ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
              <Lock className="h-4 w-4 text-[#0062ff]" />
              <span className="font-medium">
                Order distribution reveals once you take a position.
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2.5 font-semibold">
              <span className="flex items-center gap-1 text-[#0062ff]">
                <Plus className="h-3.5 w-3.5" /> Stake More in this Round
              </span>
              <span className="text-slate-400 font-normal">
                {lockedOption ? `Position locked to ${lockedOption}` : 'Select side & choose amount'}
              </span>
            </div>
          )}

          {/* Stake denomination buttons */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {[500, 1000, 2500, 5000, 10000].map(amt => (
              <button
                key={amt}
                onClick={() => handleSetStake(amt)}
                className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold transition-all ${
                  stakeAmount === amt
                    ? 'bg-[#0062ff] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                ₦{formatCredits(amt)}
              </button>
            ))}
            <button
              onClick={() => handlePercentageStake(50)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              50%
            </button>
            <button
              onClick={() => handlePercentageStake(100)}
              className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 font-mono text-xs font-bold text-[#0062ff] hover:bg-blue-100"
            >
              MAX
            </button>
          </div>

          {/* Custom Stake Input with Balance helper */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                ₦
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={inputVal}
                onChange={handleCustomInput}
                placeholder="Stake amount"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-7 pr-3 text-sm font-bold font-mono text-slate-900 focus:border-[#0062ff] focus:outline-none"
              />
            </div>

            {/* Confirm / Stake More Button */}
            <button
              onClick={handleConfirmStake}
              disabled={isSubmitting || !selectedOption || stakeAmount <= 0}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                !selectedOption || stakeAmount <= 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : selectedOption === 'YES'
                  ? 'bg-[#0062ff] text-white hover:bg-blue-600 active:scale-95'
                  : 'bg-[#e11d48] text-white hover:bg-rose-700 active:scale-95'
              }`}
            >
              <span>
                {hasUserParticipated
                  ? `Stake More on ${selectedOption}`
                  : `Confirm ${selectedOption}`}
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {errorMessage && (
            <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* RECENT LIVE STAKES: POSITIONED BELOW STAKE CONTROLS */}
        {hasUserParticipated && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-[#f7faff] p-3.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
              <span>Recent Live Stakes</span>
              <span className="text-[#0062ff] font-mono">Live Feed ●</span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {liveFeed.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-100"
                >
                  <span className="text-slate-600 font-medium">{item.username}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        item.option === 'YES'
                          ? 'bg-blue-50 text-[#0062ff]'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {item.option}
                    </span>
                    <span className="font-semibold text-slate-800">
                      ₦{formatCredits(item.stake)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PREVIOUS ROUNDS FEED (90-Second Intervals) */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Previous Market Rounds
          </span>
          <span className="text-xs font-semibold text-[#0062ff]">
            Resolved Pool
          </span>
        </div>

        {pastRounds.slice(0, 2).map(round => {
          const isYesWinner = round.winningOption === 'YES';
          const isTie = round.winningOption === 'TIE';

          return (
            <div
              key={round.roundId}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 border border-slate-200">
                  #{round.roundNumber}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-slate-400">
                      {round.roundId} · Resolved
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isTie
                          ? 'bg-amber-100 text-amber-700'
                          : isYesWinner
                          ? 'bg-blue-100 text-[#0062ff]'
                          : 'bg-rose-100 text-rose-600'
                      }`}
                    >
                      {isTie ? 'Rolled Over' : `${round.winningOption} Won`}
                    </span>
                  </div>

                  <h2 className="mt-1 text-sm font-bold text-slate-800 leading-snug">
                    Round #{round.roundNumber}: Which option attracted the most money?
                  </h2>
                </div>
              </div>

              {/* Resolved Stats */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`rounded-xl border p-2 text-center ${
                    isYesWinner
                      ? 'border-[#cce4ff] bg-[#f0f7ff] text-[#0062ff] font-bold'
                      : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}
                >
                  <div>YES Total</div>
                  <div className="font-mono text-sm font-bold">₦{formatCredits(round.yesTotal)}</div>
                </div>

                <div
                  className={`rounded-xl border p-2 text-center ${
                    round.winningOption === 'NO'
                      ? 'border-[#ffd2d8] bg-[#fff1f3] text-[#e11d48] font-bold'
                      : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}
                >
                  <div>NO Total</div>
                  <div className="font-mono text-sm font-bold">₦{formatCredits(round.noTotal)}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Total Pot: ₦{formatCredits(round.totalPot)}</span>
                <span className="font-medium text-slate-400">Ended 1m ago</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* POPUP BOX: APPEARS WHEN USER ATTEMPTS TO STAKE TO SET NAME AND AVATAR */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-50 text-[#0062ff] flex items-center justify-center font-bold">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Set Player Profile</h3>
                  <p className="text-[11px] text-slate-500">Pick your name and avatar to stake</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Avatar Showcase */}
            <div className="mt-4 flex flex-col items-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-2 border-[#0062ff] overflow-hidden bg-slate-100 ring-4 ring-blue-50 shadow-md">
                  <img
                    src={profileAvatar}
                    alt="Selected Avatar"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleShuffleProfileAvatar}
                  title="Randomize Avatar"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#0062ff] text-white shadow-md hover:bg-blue-700 active:scale-95 transition-transform"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Avatar Preset Chips */}
              <div className="mt-3.5 w-full">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5 text-center">
                  Choose Avatar
                </div>
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfileAvatar(av)}
                      className={`h-9 w-9 rounded-xl overflow-hidden shrink-0 border-2 transition-transform active:scale-90 ${
                        profileAvatar === av
                          ? 'border-[#0062ff] ring-2 ring-blue-200 scale-105'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={av} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleShuffleProfileAvatar}
                    title="Roll Random Avatar"
                    className="h-9 w-9 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center shrink-0 hover:bg-slate-50 text-slate-500 active:scale-90"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Player Name Input */}
            <div className="mt-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Player Name
              </label>
              <input
                type="text"
                maxLength={20}
                autoFocus
                value={profileUsername}
                onChange={e => {
                  setProfileUsername(e.target.value);
                  setProfileError(null);
                }}
                placeholder="e.g. ApexTrader, NaijaWhale"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-[#0062ff] focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Displays on live feed & leaderboard</span>
                <span>{profileUsername.length}/20</span>
              </div>
            </div>

            {profileError && (
              <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {/* Stake Summary Notice */}
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Pending Stake:</span>
              <div className="font-mono font-bold">
                <span className={selectedOption === 'YES' ? 'text-[#0062ff]' : 'text-[#e11d48]'}>
                  {selectedOption}
                </span>
                <span className="text-slate-800 ml-1.5">₦{formatCredits(stakeAmount)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfileAndStake}
                disabled={!profileUsername.trim()}
                className={`rounded-xl py-2.5 text-xs font-bold text-white transition-all shadow-sm ${
                  selectedOption === 'YES'
                    ? 'bg-[#0062ff] hover:bg-blue-600'
                    : 'bg-[#e11d48] hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                Save & Stake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
