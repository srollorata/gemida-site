'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Shield,
  AlertCircle,
  Search,
  Eye,
  Network
} from 'lucide-react';
import { mockFamilyMembers } from '@/data/mockData';
import { FamilyMember } from '@/types';

const STORAGE_KEY = 'family-tree-data';

export default function AdminFamilyTreePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [viewingMember, setViewingMember] = useState<FamilyMember | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load family tree members from localStorage or use mock data
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFamilyMembers(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading family tree from storage:', error);
        setFamilyMembers(mockFamilyMembers);
      }
    } else {
      setFamilyMembers(mockFamilyMembers);
    }
  }, []);

  // Save family tree to localStorage whenever it changes
  useEffect(() => {
    if (familyMembers.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(familyMembers));
    }
  }, [familyMembers]);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only administrators can manage the family tree.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.relationship.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateMember = (member: FamilyMember): boolean => {
    const errors: Record<string, string> = {};
    
    if (!member.name || member.name.trim() === '') {
      errors.name = 'Name is required';
    }
    
    if (!member.relationship || member.relationship.trim() === '') {
      errors.relationship = 'Relationship is required';
    }
    
    if (member.birthDate && new Date(member.birthDate) > new Date()) {
      errors.birthDate = 'Birth date cannot be in the future';
    }
    
    if (member.deathDate && member.birthDate) {
      if (new Date(member.deathDate) < new Date(member.birthDate)) {
        errors.deathDate = 'Death date cannot be before birth date';
      }
    }
    
    if (member.spouse && member.spouse === member.id) {
      errors.spouse = 'A member cannot be their own spouse';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMember = () => {
    const newMember: FamilyMember = {
      id: `fm-${Date.now()}`,
      name: '',
      relationship: '',
      birthDate: '',
      profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      biography: '',
      occupation: '',
      location: '',
      parents: [],
      children: []
    };
    setEditingMember(newMember);
    setIsAddingMember(true);
    setFormErrors({});
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember({ ...member });
    setIsAddingMember(false);
    setFormErrors({});
  };

  const handleSaveMember = () => {
    if (!editingMember) return;

    if (!validateMember(editingMember)) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors in the form before saving.',
      });
      return;
    }

    if (isAddingMember) {
      setFamilyMembers([...familyMembers, editingMember]);
      toast({
        title: 'Family Member Added',
        description: `${editingMember.name} has been added to the family tree.`,
      });
    } else {
      setFamilyMembers(familyMembers.map(m => m.id === editingMember.id ? editingMember : m));
      toast({
        title: 'Family Member Updated',
        description: `${editingMember.name} has been updated successfully.`,
      });
    }

    setEditingMember(null);
    setIsAddingMember(false);
    setFormErrors({});
  };

  const handleDeleteClick = (memberId: string) => {
    setMemberToDelete(memberId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!memberToDelete) return;

    const member = familyMembers.find(m => m.id === memberToDelete);
    if (member) {
      // Remove references to this member from other members
      const updatedMembers = familyMembers
        .filter(m => m.id !== memberToDelete)
        .map(m => {
          const updated = { ...m };
          
          // Remove from parents array
          if (updated.parents?.includes(memberToDelete)) {
            updated.parents = updated.parents.filter(id => id !== memberToDelete);
          }
          
          // Remove from children array
          if (updated.children?.includes(memberToDelete)) {
            updated.children = updated.children.filter(id => id !== memberToDelete);
          }
          
          // Remove spouse reference
          if (updated.spouse === memberToDelete) {
            updated.spouse = undefined;
          }
          
          return updated;
        });

      setFamilyMembers(updatedMembers);
      toast({
        title: 'Family Member Deleted',
        description: `${member.name} has been removed from the family tree.`,
      });
    }

    setDeleteConfirmOpen(false);
    setMemberToDelete(null);
  };

  const updateEditingMember = (field: keyof FamilyMember, value: any) => {
    if (!editingMember) return;
    setEditingMember({ ...editingMember, [field]: value });
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  const toggleRelationship = (type: 'parents' | 'children', memberId: string) => {
    if (!editingMember) return;
    
    const current = editingMember[type] || [];
    const updated = current.includes(memberId)
      ? current.filter(id => id !== memberId)
      : [...current, memberId];
    
    updateEditingMember(type, updated);
  };

  const getMemberName = (memberId: string) => {
    return familyMembers.find(m => m.id === memberId)?.name || memberId;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Family Tree</h1>
        <p className="text-gray-600">Add, edit, and organize all family members in your family tree</p>
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
                    onClick={() => setViewingMember(member)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditMember(member)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Member Dialog */}
      <Dialog open={!!viewingMember} onOpenChange={() => setViewingMember(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Family Member Details</DialogTitle>
          </DialogHeader>
          
          {viewingMember && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={viewingMember.profileImage} alt={viewingMember.name} />
                  <AvatarFallback className="text-lg">
                    {viewingMember.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold">{viewingMember.name}</h3>
                  <Badge variant="secondary" className="mt-1">{viewingMember.relationship}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {viewingMember.birthDate && (
                  <div>
                    <Label className="text-sm text-gray-500">Birth Date</Label>
                    <p className="font-medium">{new Date(viewingMember.birthDate).toLocaleDateString()}</p>
                  </div>
                )}
                {viewingMember.deathDate && (
                  <div>
                    <Label className="text-sm text-gray-500">Death Date</Label>
                    <p className="font-medium">{new Date(viewingMember.deathDate).toLocaleDateString()}</p>
                  </div>
                )}
                {viewingMember.occupation && (
                  <div>
                    <Label className="text-sm text-gray-500">Occupation</Label>
                    <p className="font-medium">{viewingMember.occupation}</p>
                  </div>
                )}
                {viewingMember.location && (
                  <div>
                    <Label className="text-sm text-gray-500">Location</Label>
                    <p className="font-medium">{viewingMember.location}</p>
                  </div>
                )}
              </div>

              {viewingMember.biography && (
                <div>
                  <Label className="text-sm text-gray-500">Biography</Label>
                  <p className="mt-1">{viewingMember.biography}</p>
                </div>
              )}

              {viewingMember.spouse && (
                <div>
                  <Label className="text-sm text-gray-500">Spouse</Label>
                  <p className="font-medium">{getMemberName(viewingMember.spouse)}</p>
                </div>
              )}

              {viewingMember.parents && viewingMember.parents.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-500">Parents</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {viewingMember.parents.map(parentId => (
                      <Badge key={parentId} variant="outline">{getMemberName(parentId)}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewingMember.children && viewingMember.children.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-500">Children</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {viewingMember.children.map(childId => (
                      <Badge key={childId} variant="outline">{getMemberName(childId)}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (viewingMember) handleEditMember(viewingMember);
                    setViewingMember(null);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setViewingMember(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Add Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => {
        setEditingMember(null);
        setIsAddingMember(false);
        setFormErrors({});
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingMember ? 'Add New Family Member' : 'Edit Family Member'}
            </DialogTitle>
          </DialogHeader>
          
          {editingMember && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={editingMember.name}
                    onChange={(e) => updateEditingMember('name', e.target.value)}
                    placeholder="Enter full name"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Input
                    id="relationship"
                    value={editingMember.relationship}
                    onChange={(e) => updateEditingMember('relationship', e.target.value)}
                    placeholder="e.g., Father, Mother, Son, Daughter"
                    className={formErrors.relationship ? 'border-red-500' : ''}
                  />
                  {formErrors.relationship && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.relationship}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={editingMember.birthDate || ''}
                    onChange={(e) => updateEditingMember('birthDate', e.target.value)}
                    className={formErrors.birthDate ? 'border-red-500' : ''}
                  />
                  {formErrors.birthDate && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.birthDate}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="deathDate">Death Date (if applicable)</Label>
                  <Input
                    id="deathDate"
                    type="date"
                    value={editingMember.deathDate || ''}
                    onChange={(e) => updateEditingMember('deathDate', e.target.value)}
                    className={formErrors.deathDate ? 'border-red-500' : ''}
                  />
                  {formErrors.deathDate && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.deathDate}</p>
                  )}
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

              {/* Relationship Management */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Family Relationships</h3>
                
                <div>
                  <Label htmlFor="spouse">Spouse</Label>
                  <Select
                    value={editingMember.spouse || 'none'}
                    onValueChange={(value) => updateEditingMember('spouse', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger className={formErrors.spouse ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select spouse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {familyMembers
                        .filter(m => m.id !== editingMember.id)
                        .map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {formErrors.spouse && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.spouse}</p>
                  )}
                </div>

                <div>
                  <Label>Parents</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {familyMembers
                      .filter(m => m.id !== editingMember.id)
                      .map(member => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`parent-${member.id}`}
                            checked={editingMember.parents?.includes(member.id) || false}
                            onCheckedChange={() => toggleRelationship('parents', member.id)}
                          />
                          <Label
                            htmlFor={`parent-${member.id}`}
                            className="font-normal cursor-pointer"
                          >
                            {member.name}
                          </Label>
                        </div>
                      ))}
                    {familyMembers.filter(m => m.id !== editingMember.id).length === 0 && (
                      <p className="text-sm text-gray-500">No other members available</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Children</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {familyMembers
                      .filter(m => m.id !== editingMember.id)
                      .map(member => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`child-${member.id}`}
                            checked={editingMember.children?.includes(member.id) || false}
                            onCheckedChange={() => toggleRelationship('children', member.id)}
                          />
                          <Label
                            htmlFor={`child-${member.id}`}
                            className="font-normal cursor-pointer"
                          >
                            {member.name}
                          </Label>
                        </div>
                      ))}
                    {familyMembers.filter(m => m.id !== editingMember.id).length === 0 && (
                      <p className="text-sm text-gray-500">No other members available</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingMember(null);
                    setIsAddingMember(false);
                    setFormErrors({});
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the family member
              {memberToDelete && ` "${getMemberName(memberToDelete)}"`} and remove all references to them
              from other family members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {filteredMembers.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No family members found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

