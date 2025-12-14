'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      // Show status briefly when it changes
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);

      return () => clearTimeout(timer);
    };

    // Initial check
    setIsOnline(navigator.onLine);

    globalThis.addEventListener('online', updateOnlineStatus);
    globalThis.addEventListener('offline', updateOnlineStatus);

    return () => {
      globalThis.removeEventListener('online', updateOnlineStatus);
      globalThis.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <div
      className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${showStatus ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
    >
      <div
        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
          }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            Offline
          </>
        )}
      </div>
    </div>
  );
}
