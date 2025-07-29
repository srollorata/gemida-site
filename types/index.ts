export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  profileImage?: string;
  familyMemberId?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  profileImage?: string;
  relationship: string;
  parents?: string[];
  spouse?: string;
  children?: string[];
  biography?: string;
  occupation?: string;
  location?: string;
  isUser?: boolean;
  userId?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'birthday' | 'wedding' | 'graduation' | 'reunion' | 'memorial' | 'achievement' | 'other';
  participants: string[];
  photos?: string[];
  location?: string;
  createdBy: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  type: 'birth' | 'death' | 'marriage' | 'graduation' | 'career' | 'achievement' | 'other';
  familyMemberId?: string;
  relatedMembers?: string[];
}