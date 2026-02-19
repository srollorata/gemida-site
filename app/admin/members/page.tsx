'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Eye
} from 'lucide-react';
import { User } from '@/types';
import { apiRequest } from '@/lib/api-client';
import { ImageUpload } from '@/components/ImageUpload';

export default function AdminMembersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [viewingMember, setViewingMember] = useState<User | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  // Load users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('/api/users');
        if (response.ok) {
          const data = await response.json();
          setMembers(data.users || []);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load users',
          });
        }
      } catch (error) {
        console.error('Error loading users:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load users',
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFamilyMembers = async () => {
      try {
        const response = await apiRequest('/api/family-members');
        if (response.ok) {
          const data = await response.json();
          setFamilyMembers(data.familyMembers || []);
        }
      } catch (error) {
        console.error('Error loading family members:', error);
      }
    };

    if (user) {
      fetchUsers();
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
            Access denied. Only administrators can manage members.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // View and pagination state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Paginated members based on filteredMembers and currentPage
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage));
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    // Reset to first page when search term, filtered members count, or view mode change
    setCurrentPage(1);
  }, [searchTerm, filteredMembers.length, viewMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const validateMember = (member: User): boolean => {
    const errors: Record<string, string> = {};

    if (!member.name || member.name.trim() === '') {
      errors.name = 'Name is required';
    }

    if (!member.email || member.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
      errors.email = 'Invalid email format';
    }

    if (isAddingMember && !(member as any).password) {
      errors.password = 'Password is required';
    }

    if (!member.role) {
      errors.role = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMember = () => {
    const newMember: User & { password?: string } = {
      id: '', // Will be generated by API
      name: '',
      email: '',
      role: 'member',
      profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      password: '',
    };
    setEditingMember(newMember);
    setIsAddingMember(true);
    setFormErrors({});
  };

  const handleEditMember = (member: User) => {
    setEditingMember({ ...member });
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
        ? '/api/users'
        : `/api/users/${editingMember.id}`;
      const method = isAddingMember ? 'POST' : 'PUT';

      const payload: any = {
        name: editingMember.name,
        email: editingMember.email,
        role: editingMember.role,
        profileImage: editingMember.profileImage,
        familyMemberId: editingMember.familyMemberId,
      };

      if (isAddingMember && (editingMember as any).password) {
        payload.password = (editingMember as any).password;
      } else if (!isAddingMember && (editingMember as any).password) {
        payload.password = (editingMember as any).password;
      }

      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const savedUser = data.user;

        if (isAddingMember) {
          setMembers([...members, savedUser]);
          toast({
            title: 'Member Added',
            description: `${savedUser.name} has been added successfully.`,
          });
        } else {
          setMembers(members.map(m => m.id === savedUser.id ? savedUser : m));
          toast({
            title: 'Member Updated',
            description: `${savedUser.name} has been updated successfully.`,
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
          description: error.error || 'Failed to save user',
        });
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save user',
      });
    }
  };

  const handleDeleteClick = (memberId: string) => {
    setMemberToDelete(memberId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;

    const member = members.find(m => m.id === memberToDelete);
    if (!member) {
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
      return;
    }

    try {
      const response = await apiRequest(`/api/users/${memberToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembers(members.filter(m => m.id !== memberToDelete));
        toast({
          title: 'Member Deleted',
          description: `${member.name} has been deleted successfully.`,
        });
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to delete user',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user',
      });
    }

    setDeleteConfirmOpen(false);
    setMemberToDelete(null);
  };

  const updateEditingMember = (field: keyof User, value: any) => {
    if (!editingMember) return;
    setEditingMember({ ...editingMember, [field]: value });
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.name || memberId;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Manage Members</h1>
        <p className="text-muted-foreground">Add, edit, and manage users and admins who have access to the site</p>
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
                  placeholder="Search members..."
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

              <Button onClick={handleAddMember} className="bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Listing - Grid or Paginated List */}
      {viewMode === 'grid' ? (
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

                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {member.name}
                  </h3>

                  <Badge variant="secondary" className="mb-3">
                    {member.role}
                  </Badge>

                  <p className="text-sm text-muted-foreground mb-4">
                    {member.email}
                  </p>

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
                        <p className="text-sm text-muted-foreground">{member.email}</p>
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
              <p className="text-sm text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length}</p>
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
            <DialogTitle>Member Details</DialogTitle>
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
                  <Badge variant="secondary" className="mt-1">{viewingMember.role}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{viewingMember.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <p className="font-medium">{viewingMember.role}</p>
                </div>
                {viewingMember.familyMemberId && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Linked Family Member</Label>
                    <p className="font-medium">
                      {familyMembers.find(fm => fm.id === viewingMember.familyMemberId)?.name || viewingMember.familyMemberId}
                    </p>
                  </div>
                )}
              </div>

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
              {isAddingMember ? 'Add New Member' : 'Edit Member'}
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
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => updateEditingMember('email', e.target.value)}
                    placeholder="Enter email address"
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={editingMember.role}
                    onValueChange={(value) => updateEditingMember('role', value)}
                  >
                    <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.role}</p>
                  )}
                </div>

                {isAddingMember && (
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={(editingMember as any).password || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, password: e.target.value } as any)}
                      placeholder="Enter password"
                      className={formErrors.password ? 'border-red-500' : ''}
                    />
                    {formErrors.password && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="familyMemberId">Link to Family Member</Label>
                  <Select
                    value={editingMember.familyMemberId || 'none'}
                    onValueChange={(value) => updateEditingMember('familyMemberId', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select family member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {familyMembers
                        .filter(fm => !fm.userId || fm.userId === editingMember.id)
                        .map(fm => (
                          <SelectItem key={fm.id} value={fm.id}>
                            {fm.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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

              {!isAddingMember && (
                <div>
                  <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={(editingMember as any).password || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, password: e.target.value } as any)}
                    placeholder="Enter new password"
                  />
                </div>
              )}

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
            <p className="text-muted-foreground">Loading members...</p>
          </CardContent>
        </Card>
      ) : filteredMembers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No members found matching your search.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}