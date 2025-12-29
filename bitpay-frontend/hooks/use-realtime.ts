/**
 * Real-time WebSocket Hook
 * Connects to Socket.io for live blockchain event updates
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';

let socket: Socket | null = null;

export interface RealtimeEvent {
  type: string;
  role?: string;
  data: any;
}

export function useRealtime() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('✅ WebSocket connected:', socket?.id);
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }

    // Join user-specific room if authenticated
    if (user?.walletAddress && socket) {
      socket.emit('join-user-room', user.walletAddress);
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, [user?.walletAddress]);

  const subscribe = useCallback((eventName: string, callback: (data: any) => void) => {
    if (!socket) return;

    socket.on(eventName, callback);

    return () => {
      socket?.off(eventName, callback);
    };
  }, []);

  const joinStream = useCallback((streamId: string) => {
    if (socket) {
      socket.emit('join-stream-room', streamId);
    }
  }, []);

  const leaveStream = useCallback((streamId: string) => {
    if (socket) {
      socket.emit('leave-stream-room', streamId);
    }
  }, []);

  const joinMarketplace = useCallback(() => {
    if (socket) {
      socket.emit('join-marketplace');
    }
  }, []);

  return {
    isConnected,
    subscribe,
    joinStream,
    leaveStream,
    joinMarketplace,
    socket,
  };
}

/**
 * Hook for listening to stream-specific events
 */
export function useStreamEvents(streamId: string | null) {
  const { subscribe, joinStream, leaveStream, isConnected } = useRealtime();
  const [streamData, setStreamData] = useState<any>(null);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    if (!streamId || !isConnected) return;

    // Join stream room
    joinStream(streamId);

    // Listen for stream updates
    const unsubscribe = subscribe('stream:updated', (event: RealtimeEvent) => {
      console.log('📊 Stream update received:', event);
      setLastEvent(event);
      setStreamData((prev: any) => ({ ...prev, ...event.data }));
    });

    return () => {
      if (unsubscribe) unsubscribe();
      leaveStream(streamId);
    };
  }, [streamId, isConnected, joinStream, leaveStream, subscribe]);

  return { streamData, lastEvent, isConnected };
}

/**
 * Hook for listening to user-specific events
 */
export function useUserEvents() {
  const { subscribe, isConnected } = useRealtime();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handlers = [
      subscribe('stream:created', (event: RealtimeEvent) => {
        console.log('🎉 Stream created:', event);
        setEvents((prev) => [event, ...prev].slice(0, 50)); // Keep last 50 events
      }),

      subscribe('stream:withdrawal', (event: RealtimeEvent) => {
        console.log('💰 Withdrawal:', event);
        setEvents((prev) => [event, ...prev].slice(0, 50));
      }),

      subscribe('stream:cancelled', (event: RealtimeEvent) => {
        console.log('❌ Stream cancelled:', event);
        setEvents((prev) => [event, ...prev].slice(0, 50));
      }),

      subscribe('marketplace:listing', (event: RealtimeEvent) => {
        console.log('📝 New listing:', event);
        setEvents((prev) => [event, ...prev].slice(0, 50));
      }),

      subscribe('marketplace:sale', (event: RealtimeEvent) => {
        console.log('🎊 Sale completed:', event);
        setEvents((prev) => [event, ...prev].slice(0, 50));
      }),
    ];

    return () => {
      handlers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [isConnected, subscribe]);

  return { events, isConnected };
}

/**
 * Hook for marketplace real-time updates
 */
export function useMarketplaceEvents() {
  const { subscribe, joinMarketplace, isConnected } = useRealtime();
  const [listings, setListings] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    joinMarketplace();

    const handlers = [
      subscribe('marketplace:new-listing', (data: any) => {
        console.log('🆕 New listing:', data);
        setListings((prev) => [data, ...prev]);
      }),

      subscribe('marketplace:listing-updated', (data: any) => {
        console.log('✏️ Listing updated:', data);
        setListings((prev) =>
          prev.map((listing) =>
            listing.streamId === data.streamId ? { ...listing, ...data } : listing
          )
        );
      }),

      subscribe('marketplace:listing-cancelled', (data: any) => {
        console.log('🗑️ Listing cancelled:', data);
        setListings((prev) =>
          prev.filter((listing) => listing.streamId !== data.streamId)
        );
      }),

      subscribe('marketplace:sale', (data: any) => {
        console.log('💸 Sale completed:', data);
        setSales((prev) => [data, ...prev]);
        setListings((prev) =>
          prev.filter((listing) => listing.streamId !== data.streamId)
        );
      }),
    ];

    return () => {
      handlers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [isConnected, joinMarketplace, subscribe]);

  return { listings, sales, isConnected };
}
