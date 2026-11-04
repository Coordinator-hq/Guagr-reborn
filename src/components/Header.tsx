import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { Bell, ChevronDown } from 'lucide-react';
import { GuagrLogo } from './common/GuagrLogo';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const { currentUser, allUsers, switchUser, unreadNotificationsCount } = useMarket();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const formatCredits = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
        {/* Left: Improved guagr Logo */}
        <GuagrLogo size="md" />

        {/* Right: Clean Balance Badge and Actual Notification Button */}
        <div className="flex items-center gap-2">
          {/* Balance Pill: displays available balance without reload faucet */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs hover:border-slate-300 transition-colors"
            >
              <span className="font-mono text-sm font-bold text-slate-800">
                ₦{formatCredits(currentUser.virtualBalance)}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Switch User Dropdown */}
            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Select Test Account
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {allUsers.map(u => (
                      <button
                        key={u.userId}
                        onClick={() => {
                          switchUser(u.userId);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                          u.userId === currentUser.userId
                            ? 'bg-blue-50 text-[#0066ff] font-bold border border-blue-100'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img
                            src={u.avatar}
                            alt=""
                            className="h-5 w-5 rounded-full bg-slate-100 shrink-0 border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <span className="truncate">{u.username}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                          ₦{formatCredits(u.virtualBalance)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
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
