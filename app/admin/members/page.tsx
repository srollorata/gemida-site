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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Shield,
  AlertCircle,
  Search
} from 'lucide-react';
import { mockFamilyMembers } from '@/data/mockData';
import { FamilyMember } from '@/types';

export default function AdminMembersPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState(mockFamilyMembers);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only administrators can manage family members.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.relationship.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = () => {
    const newMember: FamilyMember = {
      id: `fm-${Date.now()}`,
      name: '',
      relationship: '',
      birthDate: '',
      profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      biography: '',
      occupation: '',
      location: ''
    };
    setEditingMember(newMember);
    setIsAddingMember(true);
  };

  const handleSaveMember = () => {
    if (!editingMember) return;

    if (isAddingMember) {
      setMembers([...members, editingMember]);
    } else {
      setMembers(members.map(m => m.id === editingMember.id ? editingMember : m));
    }

    setEditingMember(null);
    setIsAddingMember(false);
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers(members.filter(m => m.id !== memberId));
  };

  const updateEditingMember = (field: keyof FamilyMember, value: any) => {
    if (!editingMember) return;
    setEditingMember({ ...editingMember, [field]: value });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Family Members</h1>
        <p className="text-gray-600">Add, edit, and organize your family tree members</p>
        <Badge variant="outline" className="mt-2">
          <Shield className="w-3 h-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      {/* Header Actions */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search family members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleAddMember} className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Family Member
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarImage src={member.profileImage} alt={member.name} />
                  <AvatarFallback className="text-lg">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {member.name}
                </h3>
                
                <Badge variant="secondary" className="mb-3">
                  {member.relationship}
                </Badge>
                
                {member.isUser && (
                  <Badge variant="outline" className="mb-3 text-emerald-600 border-emerald-600">
                    <Users className="w-3 h-3 mr-1" />
                    Site Member
                  </Badge>
                )}
                
                {member.birthDate && (
                  <p className="text-sm text-gray-600 mb-4">
                    Born {new Date(member.birthDate).getFullYear()}
                  </p>
                )}
                
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingMember(member);
                      setIsAddingMember(false);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Add Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => {
        setEditingMember(null);
        setIsAddingMember(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingMember ? 'Add New Family Member' : 'Edit Family Member'}
            </DialogTitle>
          </DialogHeader>
          
          {editingMember && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editingMember.name}
                    onChange={(e) => updateEditingMember('name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    value={editingMember.relationship}
                    onChange={(e) => updateEditingMember('relationship', e.target.value)}
                    placeholder="e.g., Father, Mother, Son, Daughter"
                  />
                </div>
                
                <div>
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={editingMember.birthDate || ''}
                    onChange={(e) => updateEditingMember('birthDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="deathDate">Death Date (if applicable)</Label>
                  <Input
                    id="deathDate"
                    type="date"
                    value={editingMember.deathDate || ''}
                    onChange={(e) => updateEditingMember('deathDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={editingMember.occupation || ''}
                    onChange={(e) => updateEditingMember('occupation', e.target.value)}
                    placeholder="Enter occupation"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={editingMember.location || ''}
                    onChange={(e) => updateEditingMember('location', e.target.value)}
                    placeholder="Enter current location"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="profileImage">Profile Image URL</Label>
                <Input
                  id="profileImage"
                  value={editingMember.profileImage || ''}
                  onChange={(e) => updateEditingMember('profileImage', e.target.value)}
                  placeholder="Enter image URL"
                />
              </div>
              
              <div>
                <Label htmlFor="biography">Biography</Label>
                <Textarea
                  id="biography"
                  value={editingMember.biography || ''}
                  onChange={(e) => updateEditingMember('biography', e.target.value)}
                  placeholder="Enter a brief biography..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingMember(null);
                    setIsAddingMember(false);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSaveMember} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-1" />
                  {isAddingMember ? 'Add Member' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredMembers.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No family members found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}