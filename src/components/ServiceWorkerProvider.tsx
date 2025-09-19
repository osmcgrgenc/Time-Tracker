'use client';

import { useEffect } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { toast } from '@/hooks/use-toast';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const {
    isSupported,
    isRegistered,
    isOnline,
    updateAvailable,
    updateServiceWorker,
    requestNotificationPermission
  } = useServiceWorker();

  useEffect(() => {
    if (isRegistered) {
      console.log('✅ Service Worker registered successfully');
      
      // Request notification permission after service worker is registered
      requestNotificationPermission().then((granted) => {
        if (granted) {
          console.log('✅ Notification permission granted');
        }
      });
    }
  }, [isRegistered, requestNotificationPermission]);

  useEffect(() => {
    if (updateAvailable) {
      toast({
        title: "App Update Available",
        description: "A new version is available. Click to update.",
        action: (
          <button
            onClick={updateServiceWorker}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Update
          </button>
        ),
      });
    }
  }, [updateAvailable, updateServiceWorker]);

  useEffect(() => {
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Some features may be limited while offline.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "You're back online",
        description: "All features are now available.",
      });
    }
  }, [isOnline]);

  // Show service worker status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker Status:', {
        isSupported,
        isRegistered,
        isOnline,
        updateAvailable
      });
    }
  }, [isSupported, isRegistered, isOnline, updateAvailable]);

  return <>{children}</>;
}

export default ServiceWorkerProvider;