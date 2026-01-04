"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('family-site-token');
  return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
}

export default function TimelineList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/timeline-events', { headers: { ...getAuthHeader() } });
        if (res.ok) {
          const data = await res.json();
          setEvents(data.timelineEvents || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div>Loading timeline…</div>}
        {!loading && events.length === 0 && <div className="text-muted-foreground">No timeline items yet.</div>}

        <ul className="mt-4 space-y-4">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{ev.title}</div>
                <div className="text-sm text-muted-foreground">{format(new Date(ev.date), 'PPPP')}</div>
                <div className="text-sm">{ev.description}</div>
                <div className="text-xs text-muted-foreground">{ev.isComputed ? 'Computed' : ev.isAutoAdded ? 'Auto' : 'Manual'}</div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
