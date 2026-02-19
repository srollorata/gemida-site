'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Clock,
  Heart,
  TrendingUp,
  Gift,
  Camera,
  Star,
  Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { Event, FamilyMember, TimelineEvent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { IconHover } from '@/components/ui/icon-hover';

export default function DashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const [eventsRes, familyRes, timelineRes] = await Promise.all([
          apiRequest('/api/events'),
          apiRequest('/api/family-members'),
          apiRequest('/api/timeline-events'),
        ]);

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData.events || []);
        }

        if (familyRes.ok) {
          const familyData = await familyRes.json();
          setFamilyMembers(familyData.familyMembers || []);
        }

        if (timelineRes.ok) {
          const timelineData = await timelineRes.json();
          setTimelineEvents(timelineData.timelineEvents || []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;

  const recentEvents = events.slice(0, 3);
  const upcomingBirthdays = familyMembers
    .filter(member => member.birthDate)
    .map(member => {
      const today = new Date();
      const birthDate = new Date(member.birthDate!);
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...member,
        daysUntil,
        age: today.getFullYear() - birthDate.getFullYear()
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  // Calculate years of history from earliest timeline event or family member birth date
  const earliestDate = Math.min(
    ...timelineEvents.map(e => new Date(e.date).getFullYear()),
    ...familyMembers
      .filter(m => m.birthDate)
      .map(m => new Date(m.birthDate!).getFullYear())
  );
  const yearsOfHistory = earliestDate && !isNaN(earliestDate)
    ? new Date().getFullYear() - earliestDate
    : 0;

  const stats = [
    {
      title: 'Family Members',
      value: familyMembers.length,
      icon: Users,
      color: 'text-emerald-600'
    },
    {
      title: 'Events Recorded',
      value: events.length,
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'Timeline Events',
      value: timelineEvents.length,
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      title: 'Years of History',
      value: yearsOfHistory,
      icon: Heart,
      color: 'text-red-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your family
        </p>
        <Badge variant="secondary" className="mt-2 capitalize">
          {user.role}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <IconHover><Icon className={`w-8 h-8 ${stat.color}`} /></IconHover>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconHover><Camera className="w-5 h-5 text-emerald-600" /></IconHover>
              Recent Events
            </CardTitle>
            <CardDescription>
              Latest family moments and memories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/events">View All Events</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconHover><Gift className="w-5 h-5 text-amber-600" /></IconHover>
              Upcoming Birthdays
            </CardTitle>
            <CardDescription>
              Don't forget to celebrate!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBirthdays.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <img
                    src={member.profileImage}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Turning {member.age + 1} in {member.daysUntil} days
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {member.daysUntil === 0 ? 'Today!' : `${member.daysUntil}d`}
                  </Badge>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/family-tree">View Family Tree</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHover><Star className="w-5 h-5 text-purple-600" /></IconHover>
            Quick Actions
          </CardTitle>
          <CardDescription>
            Jump to your favorite features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/family-tree">
                <IconHover><Users className="w-6 h-6 mb-2" /></IconHover>
                Family Tree
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/events">
                <IconHover><Calendar className="w-6 h-6 mb-2" /></IconHover>
                Events
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/timeline">
                <IconHover><Clock className="w-6 h-6 mb-2" /></IconHover>
                Timeline
              </Link>
            </Button>
            {user.role === 'admin' && (
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/members">
                  <IconHover><TrendingUp className="w-6 h-6 mb-2" /></IconHover>
                  Manage
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}