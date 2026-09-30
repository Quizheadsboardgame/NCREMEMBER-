import React, { useState } from 'react';
import { X, Copy, Check, Smartphone, Monitor, Laptop, ArrowRight } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const currentUrl = window.location.href;
  // Quick QR code API via qrserver or data url fallback
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=111827&margin=1`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = currentUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Sync on Any Device
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phone, Tablet, Laptop, or Desktop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-white border-2 border-indigo-100 dark:border-indigo-900/50 rounded-2xl shadow-md mb-3">
              <img
                src={qrApiUrl}
                alt="Scan to open on mobile"
                className="w-48 h-48 rounded-lg"
                loading="eager"
              />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Point your phone camera to open instantly
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Open this app on your mobile device or another computer, sign in with the same Google account, and your tasks sync automatically in milliseconds!
            </p>
          </div>

          {/* Account sync badge */}
          {userEmail ? (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <div>
                <span className="font-semibold block">Active Sync Account:</span>
                <span className="opacity-90">{userEmail}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-1 rounded">
                Live Cloud Sync
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold">Tip for multi-device sync:</p>
              <p className="mt-0.5 opacity-90">
                Sign in with Google on both devices so they share the exact same database.
              </p>
            </div>
          )}

          {/* App URL copy */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
              Direct App Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono truncate"
              />
              <button
                onClick={copyUrl}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Device Icons illustration */}
          <div className="flex items-center justify-center gap-3 pt-1 text-slate-400 dark:text-slate-500 text-xs">
            <span className="flex items-center gap-1">
              <Smartphone className="w-4 h-4 text-indigo-500" /> Phone
            </span>
            <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
            <span className="flex items-center gap-1">
              <Laptop className="w-4 h-4 text-amber-500" /> Laptop
            </span>
            <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
            <span className="flex items-center gap-1">
              <Monitor className="w-4 h-4 text-emerald-500" /> Workstation
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
