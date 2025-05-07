'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, Database, RotateCw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isConnected, reconnect, getConnectionError } from '@/lib/db-connection';

// Create context for database connection status
interface DatabaseContextType {
  connected: boolean;
  error: Error | null;
  retryConnection: () => Promise<boolean>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  connected: false,
  error: null,
  retryConnection: async () => false
});

// Hook to access database connection status
export const useDatabaseStatus = () => useContext(DatabaseContext);

interface DatabaseProviderProps {
  children: ReactNode;
}

// Provider component that wraps the app
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [connected, setConnected] = useState(isConnected());
  const [error, setError] = useState<Error | null>(getConnectionError());
  const [retrying, setRetrying] = useState(false);

  // Check connection status periodically
  useEffect(() => {
    setConnected(isConnected());
    setError(getConnectionError());

    const interval = setInterval(() => {
      setConnected(isConnected());
      setError(getConnectionError());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Function to retry connection
  const retryConnection = async () => {
    setRetrying(true);
    try {
      const success = await reconnect();
      setConnected(success);
      setError(getConnectionError());
      return success;
    } finally {
      setRetrying(false);
    }
  };

  // If there's a database error, show an error message
  if (error && !connected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg mb-6">
          <AlertTitle className="mb-2">Database Connection Error</AlertTitle>
          <AlertDescription>
            <p className="mb-4">{error.message}</p>
            <p className="text-sm">
              This could be due to a temporary database outage or configuration issue.
            </p>
          </AlertDescription>
        </Alert>
        <Button 
          onClick={retryConnection} 
          disabled={retrying}
          className="flex items-center gap-2"
        >
          <RefreshCw className={retrying ? 'animate-spin' : ''} size={16} />
          {retrying ? 'Retrying...' : 'Retry Connection'}
        </Button>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ connected, error, retryConnection }}>
      {children}
    </DatabaseContext.Provider>
  );
} 