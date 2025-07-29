'use client';

import React from 'react';
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
  Star
} from 'lucide-react';
import { mockEvents, mockFamilyMembers, mockTimelineEvents } from '@/data/mockData';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const recentEvents = mockEvents.slice(0, 3);
  const upcomingBirthdays = mockFamilyMembers
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

  const stats = [
    {
      title: 'Family Members',
      value: mockFamilyMembers.length,
      icon: Users,
      color: 'text-emerald-600'
    },
    {
      title: 'Events Recorded',
      value: mockEvents.length,
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'Timeline Events',
      value: mockTimelineEvents.length,
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      title: 'Years of History',
      value: new Date().getFullYear() - 1955,
      icon: Heart,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600">
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
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
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
              <Camera className="w-5 h-5 text-emerald-600" />
              Recent Events
            </CardTitle>
            <CardDescription>
              Latest family moments and memories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
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
              <Gift className="w-5 h-5 text-amber-600" />
              Upcoming Birthdays
            </CardTitle>
            <CardDescription>
              Don't forget to celebrate!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBirthdays.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <img
                    src={member.profileImage}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">
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
            <Star className="w-5 h-5 text-purple-600" />
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
                <Users className="w-6 h-6 mb-2" />
                Family Tree
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/events">
                <Calendar className="w-6 h-6 mb-2" />
                Events
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/timeline">
                <Clock className="w-6 h-6 mb-2" />
                Timeline
              </Link>
            </Button>
            {user.role === 'admin' && (
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/members">
                  <TrendingUp className="w-6 h-6 mb-2" />
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