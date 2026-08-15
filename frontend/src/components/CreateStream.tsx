'use client';

import { useState } from 'react';
import { getAddress } from '@stellar/freighter-api';
import { createStream } from '@/lib/contracts';
import { parseAmount, validateStellarAddress } from '@/lib/utils';

export default function CreateStream() {
  const [formData, setFormData] = useState({
    receiver: '',
    token: '',
    amount: '',
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '00:00',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (!validateStellarAddress(formData.receiver)) {
      return 'Invalid receiver address';
    }
    if (!validateStellarAddress(formData.token)) {
      return 'Invalid token address';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return 'Amount must be positive';
    }
    if (!formData.startDate || !formData.endDate) {
      return 'Please select start and end dates';
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).getTime();
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`).getTime();

    if (startDateTime >= endDateTime) {
      return 'End time must be after start time';
    }
    if (startDateTime < Date.now()) {
      return 'Start time cannot be in the past';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const sender = await getAddress();
      const startTime = Math.floor(
        new Date(`${formData.startDate}T${formData.startTime}`).getTime() / 1000
      );
      const endTime = Math.floor(
        new Date(`${formData.endDate}T${formData.endTime}`).getTime() / 1000
      );

      await createStream(
        sender,
        formData.receiver,
        formData.token,
        parseAmount(formData.amount),
        startTime,
        endTime
      );

      setSuccess('Stream created successfully!');
      setFormData({
        receiver: '',
        token: '',
        amount: '',
        startDate: '',
        startTime: '00:00',
        endDate: '',
        endTime: '00:00',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create stream');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-8 max-w-2xl">
      <h3 className="text-2xl font-semibold mb-6">Create Continuous Stream</h3>
      <p className="text-zinc-400 mb-8">
        Deploy a time-bound SAC token stream to fund contributors continuously.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Receiver Address</label>
          <input
            type="text"
            name="receiver"
            placeholder="GBZXN7PIRZGNMHGA7MUZNBXOITXFDBF26YNAQRF5APTKGB64J3PTLR27"
            value={formData.receiver}
            onChange={handleInputChange}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Token Address</label>
          <input
            type="text"
            name="token"
            placeholder="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
            value={formData.token}
            onChange={handleInputChange}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Amount</label>
          <input
            type="number"
            name="amount"
            placeholder="1000"
            step="0.01"
            value={formData.amount}
            onChange={handleInputChange}
            className="input"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="input"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="input"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-300 text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
        >
          {loading ? 'Creating Stream...' : 'Create Stream'}
        </button>
      </form>
    </div>
  );
}
