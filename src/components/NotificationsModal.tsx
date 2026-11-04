import React from 'react';
import { AppNotification } from '../types/market';
import {
  X,
  Trophy,
  RotateCw,
  Zap,
  CheckCircle2,
  Clock,
  Trash2,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'WIN':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
        );
      case 'LOSS':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
        );
      case 'ROLLOVER':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 shrink-0">
            <RotateCw className="h-4 w-4" />
          </div>
        );
      case 'STAKE_CONFIRMED':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-[#0066ff] shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case 'MARKET_ALERT':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 shrink-0">
            <Zap className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
        );
    }
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/50 backdrop-blur-xs animate-fade-in text-slate-800">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#0066ff] px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="rounded-lg p-1 text-slate-400 hover:text-[#0066ff] hover:bg-slate-50 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="rounded-lg p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-50 transition-colors"
                title="Clear all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              No notifications yet. Alerts will appear as rounds progress.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-2xl p-3 border transition-colors ${
                  !n.read
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                {getIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {n.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {formatTime(n.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 leading-snug">
                    {n.message}
                  </p>
                </div>
                {!n.read && (
                  <span className="h-2 w-2 rounded-full bg-[#0066ff] shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
