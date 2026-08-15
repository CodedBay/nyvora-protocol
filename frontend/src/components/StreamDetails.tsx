'use client';

import { useState } from 'react';
import { getStream, getAvailableBalance, withdrawFromStream } from '@/lib/contracts';
import { formatAmount, formatDate, getTimeRemaining } from '@/lib/utils';

interface StreamDetailsProps {
  streamId: string | null;
  onStreamIdChange: (id: string | null) => void;
}

export default function StreamDetails({ streamId, onStreamIdChange }: StreamDetailsProps) {
  const [inputStreamId, setInputStreamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<any | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const handleLoadStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStream(null);
    setBalance(null);
    setLoading(true);

    try {
      const streamData = await getStream(inputStreamId);
      const availableBalance = await getAvailableBalance(inputStreamId);
      
      setStream(streamData);
      setBalance(availableBalance);
      onStreamIdChange(inputStreamId);
    } catch (err: any) {
      setError(err.message || 'Failed to load stream');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!stream) return;

    setError(null);
    setWithdrawing(true);

    try {
      const amount = await withdrawFromStream(inputStreamId, stream.receiver);
      setBalance(balance! - amount);
      alert(`Withdrew ${formatAmount(amount)} tokens`);
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Form */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-8">
        <h3 className="text-2xl font-semibold mb-6">View Stream</h3>
        <form onSubmit={handleLoadStream} className="flex gap-4">
          <input
            type="text"
            placeholder="Enter Stream ID"
            value={inputStreamId}
            onChange={(e) => setInputStreamId(e.target.value)}
            className="input flex-1"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? 'Loading...' : 'Load Stream'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Stream Details */}
      {stream && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-semibold">Stream #{inputStreamId}</h3>
              <p className="text-zinc-400 mt-1">Active • Started on {formatDate(stream.createdAt)}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg font-semibold ${
              stream.paused ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
            }`}>
              {stream.paused ? '⏸ Paused' : '▶ Active'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Total Amount</p>
              <p className="text-xl font-semibold">{formatAmount(stream.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Withdrawn</p>
              <p className="text-xl font-semibold">{formatAmount(stream.withdrawn)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Available</p>
              <p className="text-xl font-semibold text-green-400">{formatAmount(balance || BigInt(0))}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Time Remaining</p>
              <p className="text-xl font-semibold">{getTimeRemaining(stream.endTime)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Progress</span>
              <span className="text-zinc-300">
                {Math.round(((stream.endTime - Date.now() / 1000) / (stream.endTime - stream.startTime)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, 100 - ((stream.endTime - Date.now() / 1000) / (stream.endTime - stream.startTime)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="text-sm font-semibold text-zinc-400 mb-3">Stream Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Sender</span>
                  <span className="text-sm font-mono">{stream.sender.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Receiver</span>
                  <span className="text-sm font-mono">{stream.receiver.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Token</span>
                  <span className="text-sm font-mono">{stream.token.substring(0, 8)}...</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-zinc-400 mb-3">Timeline</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Start</span>
                  <span className="text-sm">{formatDate(stream.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">End</span>
                  <span className="text-sm">{formatDate(stream.endTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Duration</span>
                  <span className="text-sm">
                    {Math.floor((stream.endTime - stream.startTime) / 86400)} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {balance && balance > BigInt(0) && (
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
            >
              {withdrawing ? 'Withdrawing...' : `Withdraw ${formatAmount(balance)} tokens`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
