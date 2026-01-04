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
  weddingDate?: string;
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
  type: string; // flexible - maps to EventType
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  completedAt?: string;
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
  type: string;
  familyMemberId?: string;
  relatedMembers?: string[];
  isAutoAdded?: boolean;
  sourceEventId?: string;
  isComputed?: boolean; // computed from family member dates
}