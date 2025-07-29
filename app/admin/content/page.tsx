'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  Clock,
  Shield,
  AlertCircle,
  Search,
  ImageIcon
} from 'lucide-react';
import { mockEvents, mockTimelineEvents, mockFamilyMembers } from '@/data/mockData';
import { Event, TimelineEvent } from '@/types';

export default function AdminContentPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState(mockEvents);
  const [timelineEvents, setTimelineEvents] = useState(mockTimelineEvents);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingTimelineEvent, setEditingTimelineEvent] = useState<TimelineEvent | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isAddingTimelineEvent, setIsAddingTimelineEvent] = useState(false);
  const [activeTab, setActiveTab] = useState('events');

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only administrators can manage content.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTimelineEvents = timelineEvents.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEvent = () => {
    const newEvent: Event = {
      id: `ev-${Date.now()}`,
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'other',
      participants: [],
      photos: [],
      location: '',
      createdBy: user!.id,
      createdAt: new Date().toISOString()
    };
    setEditingEvent(newEvent);
    setIsAddingEvent(true);
  };

  const handleAddTimelineEvent = () => {
    const newTimelineEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'other'
    };
    setEditingTimelineEvent(newTimelineEvent);
    setIsAddingTimelineEvent(true);
  };

  const handleSaveEvent = () => {
    if (!editingEvent) return;

    if (isAddingEvent) {
      setEvents([...events, editingEvent]);
    } else {
      setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
    }

    setEditingEvent(null);
    setIsAddingEvent(false);
  };

  const handleSaveTimelineEvent = () => {
    if (!editingTimelineEvent) return;

    if (isAddingTimelineEvent) {
      setTimelineEvents([...timelineEvents, editingTimelineEvent]);
    } else {
      setTimelineEvents(timelineEvents.map(e => e.id === editingTimelineEvent.id ? editingTimelineEvent : e));
    }

    setEditingTimelineEvent(null);
    setIsAddingTimelineEvent(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const handleDeleteTimelineEvent = (eventId: string) => {
    setTimelineEvents(timelineEvents.filter(e => e.id !== eventId));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Content</h1>
        <p className="text-gray-600">Create and manage family events and timeline entries</p>
        <Badge variant="outline" className="mt-2">
          <Shield className="w-3 h-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Family Events</TabsTrigger>
          <TabsTrigger value="timeline">Timeline Events</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          {/* Events Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
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
                <Button onClick={handleAddEvent} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <Badge variant="secondary">{event.type}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingEvent(event);
                        setIsAddingEvent(false);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {/* Timeline Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search timeline events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button onClick={handleAddTimelineEvent} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Timeline Event
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Events List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTimelineEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <Badge variant="secondary">{event.type}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingTimelineEvent(event);
                        setIsAddingTimelineEvent(false);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteTimelineEvent(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => {
        setEditingEvent(null);
        setIsAddingEvent(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingEvent ? 'Add New Event' : 'Edit Event'}
            </DialogTitle>
          </DialogHeader>
          
          {editingEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input
                    id="eventTitle"
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                    placeholder="Enter event title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="eventDate">Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="eventType">Type</Label>
                  <Select value={editingEvent.type} onValueChange={(value) => setEditingEvent({...editingEvent, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="reunion">Reunion</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="memorial">Memorial</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="eventLocation">Location</Label>
                  <Input
                    id="eventLocation"
                    value={editingEvent.location || ''}
                    onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                    placeholder="Enter location"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="eventDescription">Description</Label>
                <Textarea
                  id="eventDescription"
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                  placeholder="Enter event description..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingEvent(null);
                    setIsAddingEvent(false);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSaveEvent} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-1" />
                  {isAddingEvent ? 'Add Event' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Timeline Event Dialog */}
      <Dialog open={!!editingTimelineEvent} onOpenChange={() => {
        setEditingTimelineEvent(null);
        setIsAddingTimelineEvent(false);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isAddingTimelineEvent ? 'Add New Timeline Event' : 'Edit Timeline Event'}
            </DialogTitle>
          </DialogHeader>
          
          {editingTimelineEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="timelineTitle">Event Title</Label>
                  <Input
                    id="timelineTitle"
                    value={editingTimelineEvent.title}
                    onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, title: e.target.value})}
                    placeholder="Enter event title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="timelineDate">Date</Label>
                  <Input
                    id="timelineDate"
                    type="date"
                    value={editingTimelineEvent.date}
                    onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="timelineType">Type</Label>
                  <Select value={editingTimelineEvent.type} onValueChange={(value) => setEditingTimelineEvent({...editingTimelineEvent, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birth">Birth</SelectItem>
                      <SelectItem value="death">Death</SelectItem>
                      <SelectItem value="marriage">Marriage</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="career">Career</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="timelineDescription">Description</Label>
                <Textarea
                  id="timelineDescription"
                  value={editingTimelineEvent.description}
                  onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, description: e.target.value})}
                  placeholder="Enter event description..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTimelineEvent(null);
                    setIsAddingTimelineEvent(false);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSaveTimelineEvent} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-1" />
                  {isAddingTimelineEvent ? 'Add Event' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}