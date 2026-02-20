"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('family-site-token');
  return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
}

export default function EventForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('PLAN');
  const [participants, setParticipants] = useState<string[]>([]);
  const [allMembers, setAllMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/family-members', { headers: { ...getAuthHeader() } });
        if (res.ok) {
          const data = await res.json();
          setAllMembers(data.familyMembers || []);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [user]);

  const toggleParticipant = (id: string) => {
    setParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ title, description, date, type, participants }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create event');
      } else {
        setTitle('');
        setDescription('');
        setDate('');
        setType('PLAN');
        setParticipants([]);
        onCreated && onCreated();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2">
                <option value="PLAN">Plan</option>
                <option value="REUNION">Reunion</option>
                <option value="MEMORIAL">Memorial</option>
                <option value="WEDDING">Wedding</option>
                <option value="GRADUATION">Graduation</option>
                <option value="ACHIEVEMENT">Achievement</option>
                <option value="MILESTONE">Milestone</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Participants</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {allMembers.map(m => (
                <label key={m.id} className="inline-flex items-center gap-2 border rounded px-2 py-1">
                  <input type="checkbox" checked={participants.includes(m.id)} onChange={() => toggleParticipant(m.id)} />
                  <span className="text-sm">{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create'}</Button>
            {error && <div className="text-red-600">{error}</div>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
