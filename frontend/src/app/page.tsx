'use client';

import { useState } from 'react';
import ConnectWallet from '@/components/ConnectWallet';
import CreateStream from '@/components/CreateStream';
import StreamDetails from '@/components/StreamDetails';

export default function Home() {
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');

  return (
    <main className="min-h-screen bg-zinc-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                Nyvora Protocol
              </h1>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                Streaming on Stellar
              </span>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container max-w-6xl mx-auto px-4 py-16">
        <div className="mb-12 space-y-4">
          <h2 className="text-5xl font-bold tracking-tight">
            Continuous Asset<br />
            <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              Streaming & Split-Routing
            </span>
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl">
            Stream Stellar assets by the second with programmable split-routing for open-source funding and ecosystem rewards.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Create Stream
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'view'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            View Stream
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {activeTab === 'create' && <CreateStream />}
          {activeTab === 'view' && (
            <StreamDetails
              streamId={selectedStreamId}
              onStreamIdChange={setSelectedStreamId}
            />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-zinc-800/30 border-t border-zinc-800 py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-12">Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-700 hover:border-red-500/50 transition-colors">
              <h4 className="text-lg font-semibold mb-3">✨ Sub-Second Precision</h4>
              <p className="text-zinc-400">Stream tokens by the second with exact linear unlock calculations.</p>
            </div>

            <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-700 hover:border-red-500/50 transition-colors">
              <h4 className="text-lg font-semibold mb-3">🔀 Split-Routing</h4>
              <p className="text-zinc-400">Automatically route percentages of streams to multiple downstream recipients.</p>
            </div>

            <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-700 hover:border-red-500/50 transition-colors">
              <h4 className="text-lg font-semibold mb-3">🔒 Secure & Auditable</h4>
              <p className="text-zinc-400">Strict math using i128, require_auth checks, and reentrancy protection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-500">
        <div className="container max-w-6xl mx-auto px-4">
          <p>Built on Stellar Soroban • Inspired by Drips Protocol</p>
          <p className="text-xs mt-2">© 2024 Nyvora Protocol. MIT License.</p>
        </div>
      </footer>
    </main>
  );
}
