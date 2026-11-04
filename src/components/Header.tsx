import React from 'react';
import { useMarket } from '../context/MarketContext';
import { Bell, Wallet } from 'lucide-react';
import { GuagrLogo } from './common/GuagrLogo';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const { currentUser, unreadNotificationsCount } = useMarket();

  const formatCredits = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
        {/* Left: Official guagr Logo with Isolated Circle + Up Arrow Mark */}
        <GuagrLogo size="md" />

        {/* Right: Clean Wallet Balance Box (No Dropdown) & Notification Button */}
        <div className="flex items-center gap-2">
          {/* Balance Box: Clean, non-dropdown wallet pill displaying available credits */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-1.5 shadow-2xs">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-[#0062ff]">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <span className="font-mono text-sm font-bold text-slate-800 tracking-tight">
              ₦{formatCredits(currentUser.virtualBalance)}
            </span>
          </div>

          {/* Actual Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition-all"
            title="View Notifications"
          >
            <Bell className="h-4.5 w-4.5 text-slate-600" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0062ff] px-1 text-[10px] font-bold text-white shadow-xs">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

