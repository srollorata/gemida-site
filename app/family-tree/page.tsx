'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Crown, ChevronDown, ChevronRight, TreePine } from 'lucide-react';
import { mockFamilyMembers } from '@/data/mockData';
import FamilyTreeGoJS from '@/components/FamilyTreeGoJS';

export default function FamilyTreePage() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-100 rounded-full">
            <TreePine className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Tree</h1>
            <p className="text-gray-600">Explore your family connections and heritage</p>
          </div>
        </div>
      </div>
      {/* GoJS Family Tree Diagram */}
      <Card className="shadow-lg mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Family Hierarchy
          </CardTitle>
          <CardDescription>
            Interactive family tree visualization powered by GoJS.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <FamilyTreeGoJS />
        </CardContent>
      </Card>
      {/* Family Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{mockFamilyMembers.length}</p>
            <p className="text-sm text-gray-600">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <UserCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {mockFamilyMembers.filter(m => m.isUser).length}
            </p>
            <p className="text-sm text-gray-600">Site Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Crown className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {/* Number of root family branches (members without parents) */}
              {mockFamilyMembers.filter(m => !m.parents || m.parents.length === 0).length}
            </p>
            <p className="text-sm text-gray-600">Family Branches</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}