"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Event as EventType } from '@/types';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('family-site-token');
  return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
}

export default function EventList() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/events', { headers: { ...getAuthHeader() } });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to load events');
        setEvents([]);
      } else {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  const markComplete = async (id: string) => {
    try {
      await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div>Loading events…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && events.length === 0 && <div className="text-muted-foreground">No events found.</div>}

        <ul className="mt-4 space-y-4">
          {events.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{e.title}</div>
                <div className="text-sm text-muted-foreground">{format(new Date(e.date), 'PPPP')}</div>
                <div className="text-sm">{e.description}</div>
                <div className="text-xs text-muted-foreground">Status: {e.status || 'PENDING'}</div>
              </div>

              <div className="flex gap-2">
                {e.status !== 'COMPLETED' && (
                  <Button size="sm" onClick={() => markComplete(e.id)}>Mark complete</Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => remove(e.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
