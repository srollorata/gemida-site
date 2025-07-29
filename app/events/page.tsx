'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  MapPin,
  Users,
  Camera,
  Heart,
  GraduationCap,
  Trophy,
  Star,
  Gift,
  Search,
  Filter
} from 'lucide-react';
import { mockEvents, mockFamilyMembers } from '@/data/mockData';
import { Event } from '@/types';

const eventTypeIcons = {
  birthday: Gift,
  wedding: Heart,
  graduation: GraduationCap,
  reunion: Users,
  memorial: Star,
  achievement: Trophy,
  other: Calendar
};

const eventTypeColors = {
  birthday: 'bg-pink-100 text-pink-700',
  wedding: 'bg-red-100 text-red-700',
  graduation: 'bg-blue-100 text-blue-700',
  reunion: 'bg-green-100 text-green-700',
  memorial: 'bg-purple-100 text-purple-700',
  achievement: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700'
};

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const getFamilyMemberById = (id: string) => {
    return mockFamilyMembers.find(member => member.id === id);
  };

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || event.type === selectedType;
    return matchesSearch && matchesType;
  });

  const sortedEvents = filteredEvents.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Events & Memories</h1>
        <p className="text-gray-600">Cherished moments and milestones throughout our family's journey</p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="birthday">Birthdays</SelectItem>
                <SelectItem value="wedding">Weddings</SelectItem>
                <SelectItem value="graduation">Graduations</SelectItem>
                <SelectItem value="reunion">Reunions</SelectItem>
                <SelectItem value="achievement">Achievements</SelectItem>
                <SelectItem value="memorial">Memorials</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedEvents.map((event) => {
          const IconComponent = eventTypeIcons[event.type];
          const colorClass = eventTypeColors[event.type];
          
          return (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {event.photos && event.photos.length > 0 && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={event.photos[0]}
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {event.photos.length > 1 && (
                      <Badge className="absolute top-3 right-3 bg-black/70 text-white">
                        <Camera className="w-3 h-3 mr-1" />
                        {event.photos.length}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                    <Badge className={colorClass}>
                      <IconComponent className="w-3 h-3 mr-1" />
                      {event.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {event.participants.slice(0, 3).map((participantId) => {
                        const participant = getFamilyMemberById(participantId);
                        return participant ? (
                          <Avatar key={participantId} className="w-8 h-8 border-2 border-white">
                            <AvatarImage src={participant.profileImage} alt={participant.name} />
                            <AvatarFallback className="text-xs">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ) : null;
                      })}
                      {event.participants.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                          <span className="text-xs text-gray-600">
                            +{event.participants.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-3">
                            <Badge className={colorClass}>
                              <IconComponent className="w-4 h-4 mr-1" />
                              {event.type}
                            </Badge>
                            {event.title}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {event.photos && event.photos.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-3">Photos</h3>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {event.photos.map((photo, index) => (
                                  <img
                                    key={index}
                                    src={photo}
                                    alt={`${event.title} photo ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-gray-700">{event.description}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="font-semibold mb-3">Event Details</h3>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm">
                                    {new Date(event.date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold mb-3">Participants</h3>
                              <div className="space-y-2">
                                {event.participants.map((participantId) => {
                                  const participant = getFamilyMemberById(participantId);
                                  return participant ? (
                                    <div key={participantId} className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarImage src={participant.profileImage} alt={participant.name} />
                                        <AvatarFallback className="text-xs">
                                          {participant.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">{participant.name}</span>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedEvents.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No events found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}