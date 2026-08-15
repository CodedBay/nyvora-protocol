'use client';

import { useState, useEffect } from 'react';
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api';
import { shortenAddress } from '@/lib/utils';

export default function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await isConnected();
      if (connected) {
        const userAddress = await getAddress();
        setAddress(userAddress);
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const connect = async () => {
    setLoading(true);
    setError(null);

    try {
      const connected = await isConnected();
      if (!connected) {
        setError('Freighter wallet not found. Please install it.');
        return;
      }

      const access = await requestAccess();
      if (access) {
        const userAddress = await getAddress();
        setAddress(userAddress);
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
  };

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-300">{shortenAddress(address)}</p>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-semibold transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={connect}
        disabled={loading}
        className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? 'Connecting...' : 'Connect Freighter'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
