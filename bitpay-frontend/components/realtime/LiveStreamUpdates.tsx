/**
 * Live Stream Updates Component
 * Displays real-time stream events using WebSocket
 */

'use client';

import { useEffect, useState } from 'react';
import { useStreamEvents } from '@/hooks/use-realtime';
import { Bell, TrendingUp, ArrowDownToLine } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveStreamUpdatesProps {
  streamId: string;
}

export function LiveStreamUpdates({ streamId }: LiveStreamUpdatesProps) {
  const { lastEvent, isConnected } = useStreamEvents(streamId);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (lastEvent) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  if (!isConnected) {
    return null;
  }

  return (
    <>
      {showNotification && lastEvent && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {lastEvent.type === 'withdrawal' ? (
                  <ArrowDownToLine className="h-5 w-5" />
                ) : (
                  <TrendingUp className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">
                  {lastEvent.type === 'withdrawal' ? 'Withdrawal Processed' : 'Stream Updated'}
                </h4>
                <p className="text-sm text-white/90">
                  Stream #{streamId} was updated just now
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
