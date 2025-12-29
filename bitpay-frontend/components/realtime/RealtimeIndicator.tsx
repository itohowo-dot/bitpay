/**
 * Real-time Connection Indicator
 * Shows WebSocket connection status
 */

'use client';

import { useRealtime } from '@/hooks/use-realtime';
import { Wifi, WifiOff } from 'lucide-react';

export function RealtimeIndicator() {
  const { isConnected } = useRealtime();

  return (
    <div className="flex items-center gap-2 text-sm">
      {isConnected ? (
        <>
          <div className="relative">
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-muted-foreground hidden sm:inline">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-gray-400" />
          <span className="text-muted-foreground hidden sm:inline">Offline</span>
        </>
      )}
    </div>
  );
}
