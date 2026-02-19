'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  Heart,
  Baby,
  Skull,
  GraduationCap,
  Briefcase,
  Trophy,
  Clock,
  Filter
} from 'lucide-react';
import { TimelineEvent } from '@/types';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const eventTypeIcons: Record<string, React.ComponentType<any>> = {
  birth: Baby,
  death: Skull,
  marriage: Heart,
  graduation: GraduationCap,
  career: Briefcase,
  achievement: Trophy,
  other: Calendar
};

const eventTypeColors: Record<string, string> = {
  birth: 'bg-green-100 text-green-700 border-green-200',
  death: 'bg-muted text-muted-foreground border-border',
  marriage: 'bg-red-100 text-red-700 border-red-200',
  graduation: 'bg-blue-100 text-blue-700 border-blue-200',
  career: 'bg-purple-100 text-purple-700 border-purple-200',
  achievement: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  other: 'bg-muted text-muted-foreground border-border'
};

export default function TimelinePage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const [timelineRes, familyRes] = await Promise.all([
          apiRequest('/api/timeline-events'),
          apiRequest('/api/family-members'),
        ]);

        if (timelineRes.ok) {
          const timelineData = await timelineRes.json();
          setTimelineEvents(timelineData.timelineEvents || []);
        }

        if (familyRes.ok) {
          const familyData = await familyRes.json();
          setFamilyMembers(familyData.familyMembers || []);
        }
      } catch (error) {
        console.error('Error loading timeline events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getFamilyMemberById = (id: string) => {
    return familyMembers.find(member => member.id === id);
  };

  const getDecade = (date: string) => {
    const year = new Date(date).getFullYear();
    return Math.floor(year / 10) * 10;
  };

  const filteredEvents = timelineEvents.filter(event => {
    const matchesType = selectedType === 'all' || event.type === selectedType;
    const decade = getDecade(event.date);
    const matchesDecade = selectedDecade === 'all' || decade.toString() === selectedDecade;
    return matchesType && matchesDecade;
  });

  const sortedEvents = filteredEvents.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const decades = Array.from(
    new Set(timelineEvents.map(event => getDecade(event.date)))
  ).sort((a, b) => a - b);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Family Timeline</h1>
        <p className="text-muted-foreground">Journey through the milestones and memories of our family history</p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="birth">Births</SelectItem>
                <SelectItem value="death">Deaths</SelectItem>
                <SelectItem value="marriage">Marriages</SelectItem>
                <SelectItem value="graduation">Graduations</SelectItem>
                <SelectItem value="career">Career</SelectItem>
                <SelectItem value="achievement">Achievements</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDecade} onValueChange={setSelectedDecade}>
              <SelectTrigger className="w-full sm:w-48">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by decade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Decades</SelectItem>
                {decades.map(decade => (
                  <SelectItem key={decade} value={decade.toString()}>
                    {decade}s
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {isLoading ? (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
          <div className="space-y-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative flex items-start">
                <Skeleton className="w-16 h-16 rounded-full border-4 border-white" />
                <Card className="ml-8 flex-1">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>

          <div className="space-y-8">
            {sortedEvents.map((event, index) => {
              const typeKey = (event.type || '').toString().toLowerCase();
              const IconComponent = eventTypeIcons[typeKey] || Calendar;
              const colorClass = eventTypeColors[typeKey] || eventTypeColors['other'];
              const familyMember = event.familyMemberId ? getFamilyMemberById(event.familyMemberId) : null;
              const relatedMembers = event.relatedMembers?.map(id => getFamilyMemberById(id)).filter(Boolean) || [];

              return (
                <div key={event.id} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full border-4 ${colorClass} bg-background flex items-center justify-center shadow-lg z-10`}>
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {/* Event content */}
                  <Card className="ml-8 flex-1 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-foreground">
                              {event.title}
                            </h3>
                            <Badge variant="outline" className={colorClass}>
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{event.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Related people */}
                      {(familyMember || relatedMembers.length > 0) && (
                        <div className="border-t pt-4">
                          <div className="flex items-center gap-4">
                            {familyMember && (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={familyMember.profileImage} alt={familyMember.name} />
                                  <AvatarFallback className="text-xs">
                                    {familyMember.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{familyMember.name}</span>
                              </div>
                            )}

                            {relatedMembers.map((member, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={member.profileImage} alt={member.name} />
                                  <AvatarFallback className="text-xs">
                                    {member.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{member.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && sortedEvents.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No timeline events found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}