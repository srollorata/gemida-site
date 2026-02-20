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
import { FamilyMember } from '@/types';
import { apiRequest } from '@/lib/api-client';
import { ImageUpload } from '@/components/ImageUpload';

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
  const [isLoading, setIsLoading] = useState(true);
  // View (grid/list), sorting and pagination state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'birthDate' | 'gender'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load family tree members from API
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('/api/family-members');
        if (response.ok) {
          const data = await response.json();
          setFamilyMembers(data.familyMembers || []);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load family members',
          });
        }
      } catch (error) {
        console.error('Error loading family members:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load family members',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchFamilyMembers();
    }
  }, [user, toast]);

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
    ((member as any).gender ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply sorting to filtered results
  const sortedMembers = filteredMembers.slice().sort((a, b) => {
    let va: any;
    let vb: any;
    if (sortBy === 'birthDate') {
      va = a.birthDate ? new Date(a.birthDate).getTime() : 0;
      vb = b.birthDate ? new Date(b.birthDate).getTime() : 0;
    } else {
      va = (a as any)[sortBy] ? (a as any)[sortBy].toString().toLowerCase() : '';
      vb = (b as any)[sortBy] ? (b as any)[sortBy].toString().toLowerCase() : '';
    }

    if (va < vb) return sortOrder === 'asc' ? -1 : 1;
    if (va > vb) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination for list view
  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / itemsPerPage));
  const paginatedMembers = sortedMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    // Reset to first page when search term, filtered count, or view mode change
    setCurrentPage(1);
  }, [searchTerm, sortedMembers.length, viewMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const validateMember = (member: FamilyMember): boolean => {
    const errors: Record<string, string> = {};

    if (!member.name || member.name.trim() === '') {
      errors.name = 'Name is required';
    }

    const genderVal = (member as any).gender;
    if (!genderVal || genderVal.trim() === '') {
      errors.gender = 'Gender is required';
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
      id: '', // Will be generated by the API
      name: '',
      gender: '',
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
    // Normalize date values to YYYY-MM-DD for date inputs
    const normalized = {
      ...member,
      birthDate: member.birthDate ? new Date(member.birthDate).toISOString().slice(0, 10) : '',
      deathDate: member.deathDate ? new Date(member.deathDate).toISOString().slice(0, 10) : '',
    } as FamilyMember;
    setEditingMember(normalized);
    setIsAddingMember(false);
    setFormErrors({});
  };

  const handleSaveMember = async () => {
    if (!editingMember) return;

    if (!validateMember(editingMember)) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors in the form before saving.',
      });
      return;
    }

    try {
      const url = isAddingMember
        ? '/api/family-members'
        : `/api/family-members/${editingMember.id}`;
      const method = isAddingMember ? 'POST' : 'PUT';

      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(editingMember),
      });

      if (response.ok) {
        const data = await response.json();
        const savedMember = data.familyMember;

        if (isAddingMember) {
          setFamilyMembers([...familyMembers, savedMember]);
          toast({
            title: 'Family Member Added',
            description: `${savedMember.name} has been added to the family tree.`,
          });
        } else {
          setFamilyMembers(familyMembers.map(m => m.id === savedMember.id ? savedMember : m));
          toast({
            title: 'Family Member Updated',
            description: `${savedMember.name} has been updated successfully.`,
          });
        }

        setEditingMember(null);
        setIsAddingMember(false);
        setFormErrors({});
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to save family member',
        });
      }
    } catch (error) {
      console.error('Error saving family member:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save family member',
      });
    }
  };

  const handleDeleteClick = (memberId: string) => {
    setMemberToDelete(memberId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;

    const member = familyMembers.find(m => m.id === memberToDelete);
    if (!member) {
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
      return;
    }

    try {
      const response = await apiRequest(`/api/family-members/${memberToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFamilyMembers(familyMembers.filter(m => m.id !== memberToDelete));
        toast({
          title: 'Family Member Deleted',
          description: `${member.name} has been removed from the family tree.`,
        });
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to delete family member',
        });
      }
    } catch (error) {
      console.error('Error deleting family member:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete family member',
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Manage Family Tree</h1>
        <p className="text-muted-foreground">Add, edit, and organize all family members in your family tree</p>
        <Badge variant="outline" className="mt-2">
          <Shield className="w-3 h-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      {/* Header Actions */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search family members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-muted rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? undefined : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? undefined : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="birthDate">Birth Date</SelectItem>
                    <SelectItem value="gender">Gender</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>

              <Button onClick={handleAddMember} className="bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Family Member
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid or List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-20 h-20 mb-4">
                    <AvatarImage src={member.profileImage} alt={member.name} />
                    <AvatarFallback className="text-lg">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {member.name}
                  </h3>

                  <Badge variant="secondary" className="mb-3">
                    {member.gender}
                  </Badge>

                  {member.isUser && (
                    <Badge variant="outline" className="mb-3 text-emerald-600 border-emerald-600">
                      <Users className="w-3 h-3 mr-1" />
                      Site Member
                    </Badge>
                  )}

                  {member.birthDate && (
                    <p className="text-sm text-muted-foreground mb-4">
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
      ) : (
        <div>
          <div className="space-y-4">
            {paginatedMembers.map(member => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-4 min-h-[64px]">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.profileImage} alt={member.name} />
                        <AvatarFallback className="text-lg">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.gender}{member.birthDate ? ` • ${new Date(member.birthDate).getFullYear()}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setViewingMember(member)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" onClick={() => handleEditMember(member)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" className="text-red-600" onClick={() => handleDeleteClick(member.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedMembers.length)} of {sortedMembers.length}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</Button>
              <Button size="sm" variant="ghost" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
              <div className="px-3 py-1 bg-muted rounded-md">Page {currentPage} of {totalPages}</div>
              <Button size="sm" variant="ghost" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
              <Button size="sm" variant="ghost" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</Button>
            </div>
          </div>
        </div>
      )}

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
                  <Badge variant="secondary" className="mt-1">{viewingMember.gender}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {viewingMember.birthDate && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Birth Date</Label>
                    <p className="font-medium">{new Date(viewingMember.birthDate).toLocaleDateString()}</p>
                  </div>
                )}
                {viewingMember.deathDate && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Death Date</Label>
                    <p className="font-medium">{new Date(viewingMember.deathDate).toLocaleDateString()}</p>
                  </div>
                )}
                {viewingMember.occupation && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Occupation</Label>
                    <p className="font-medium">{viewingMember.occupation}</p>
                  </div>
                )}
                {viewingMember.location && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Location</Label>
                    <p className="font-medium">{viewingMember.location}</p>
                  </div>
                )}
              </div>

              {viewingMember.biography && (
                <div>
                  <Label className="text-sm text-muted-foreground">Biography</Label>
                  <p className="mt-1">{viewingMember.biography}</p>
                </div>
              )}

              {viewingMember.spouse && (
                <div>
                  <Label className="text-sm text-muted-foreground">Spouse</Label>
                  <p className="font-medium">{getMemberName(viewingMember.spouse)}</p>
                </div>
              )}

              {viewingMember.parents && viewingMember.parents.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Parents</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {viewingMember.parents.map(parentId => (
                      <Badge key={parentId} variant="outline">{getMemberName(parentId)}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewingMember.children && viewingMember.children.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Children</Label>
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
                  <Label htmlFor="gender">Gender *</Label>
                  <Input
                    id="gender"
                    value={editingMember.gender || ''}
                    onChange={(e) => updateEditingMember('gender' as any, e.target.value)}
                    placeholder="e.g., Male, Female, Non-binary"
                    className={(formErrors as any).gender ? 'border-red-500' : ''}
                  />
                  {(formErrors as any).gender && (
                    <p className="text-sm text-red-500 mt-1">{(formErrors as any).gender}</p>
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
                <Label htmlFor="profileImage">Profile Image</Label>
                <ImageUpload
                  value={editingMember.profileImage || ''}
                  onChange={(url) => updateEditingMember('profileImage', typeof url === 'string' ? url : url[0] || '')}
                  multiple={false}
                  className="mt-2"
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
                      <p className="text-sm text-muted-foreground">No other members available</p>
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
                      <p className="text-sm text-muted-foreground">No other members available</p>
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

      {isLoading ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading family members...</p>
          </CardContent>
        </Card>
      ) : filteredMembers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No family members found matching your search.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

