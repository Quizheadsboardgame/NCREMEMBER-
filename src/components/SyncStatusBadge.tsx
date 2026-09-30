import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Smartphone, RefreshCw, LogIn, LogOut, Wifi, WifiOff } from 'lucide-react';
import { QRCodeModal } from './QRCodeModal';

export const SyncStatusBadge: React.FC = () => {
  const { user, isOnline, cloudConnected, signInWithGoogle, signOut } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Device Sync Modal Trigger */}
        <button
          onClick={() => setShowQR(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all shadow-2xs"
          title="Open sync QR code to pair your phone or other devices"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Sync Devices</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-0.5" />
        </button>

        {/* Live sync connection pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
            !isOnline
              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
              : user
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
          }`}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-500" />
              <span>Offline</span>
            </>
          ) : user ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold">Live Sync Active</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-amber-500" />
              <span>Local Storage</span>
            </>
          )}
        </div>

        {/* User Account / Sign in button */}
        {user ? (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-2 pr-1.5 py-1 text-xs">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            )}
            <span className="text-slate-700 dark:text-slate-300 font-medium max-w-[110px] sm:max-w-[160px] truncate">
              {user.displayName || user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 rounded transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs disabled:opacity-50"
          >
            {isSigningIn ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
            <span>Sign In to Sync</span>
          </button>
        )}
      </div>

      <QRCodeModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        userEmail={user?.email}
      />
    </>
  );
};
