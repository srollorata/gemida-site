import { FamilyMember, Event, TimelineEvent } from '@/types';

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'fm-1',
    name: 'Cresenciano',
    birthDate: '1985-03-15',
    profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    relationship: 'Father',
    spouse: 'fm-2',
    children: ['fm-3', 'fm-4', 'fm-5', 'fm-6', 'fm-7'],
    biography: 'Family matriarch and business owner. Loves organizing family gatherings.',
    occupation: 'Business Owner',
    location: 'San Francisco, CA',
    isUser: true,
    userId: '1'
  },
  {
    id: 'fm-2',
    name: 'Ricarda',
    birthDate: '1983-07-22',
    profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    relationship: 'Father',
    spouse: 'fm-1',
    children: ['fm-3', 'fm-4', 'fm-5', 'fm-6', 'fm-7'],
    biography: 'Software engineer and amateur photographer. Documents all family events.',
    occupation: 'Software Engineer',
    location: 'San Francisco, CA',
    isUser: true,
    userId: '2'
  },
  {
    id: 'fm-8',
    name: 'Spouse 1',
    birthDate: '2013-05-18',
    profileImage: 'https://images.pexels.com/photos/1674666/pexels-photo-1674666.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    relationship: 'Spouse',
    spouse: 'fm-3',
    children: ['fm-9'],
    biography: 'Elementary school student who loves soccer and video games.',
    occupation: 'Student',
    location: 'San Francisco, CA'
  },
  {
    id: 'fm-3',
    name: 'Terencio Sr.',
    birthDate: '2010-12-08',
    profileImage: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    relationship: 'Son',
    spouse: 'fm-8',
    parents: ['fm-1', 'fm-2'],
    children: ['fm-9'],
    biography: 'High school student with a passion for art and music.',
    occupation: 'Student',
    location: 'San Francisco, CA',
    isUser: true,
    userId: '3'
  },
  {
    id: 'fm-4',
    name: 'Sibling 2',
    birthDate: '2013-05-18',
    profileImage: 'https://images.pexels.com/photos/1674666/pexels-photo-1674666.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    relationship: 'Son',
    parents: ['fm-1', 'fm-2'],
    biography: 'Elementary school student who loves soccer and video games.',
    occupation: 'Student',
    location: 'San Francisco, CA'
  },
  {
    id: 'fm-5',
    name: 'Sibling 3',
    birthDate: '1955-11-30',
    deathDate: '2020-08-15',
    profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    relationship: 'Grandfather',
    parents: ['fm-1', 'fm-2'],
    biography: 'Retired military officer and beloved grandfather.',
    occupation: 'Retired Military Officer',
    location: 'Austin, TX'
  },
  {
    id: 'fm-6',
    name: 'Sibling 4',
    birthDate: '1958-02-14',
    profileImage: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    relationship: 'Grandmother',
    parents: ['fm-1', 'fm-2'],
    biography: 'Retired teacher and master gardener.',
    occupation: 'Retired Teacher',
    location: 'Austin, TX'
  },
  {
    id: 'fm-7',
    name: 'Sibling 5',
    birthDate: '2013-05-18',
    profileImage: 'https://images.pexels.com/photos/1674666/pexels-photo-1674666.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    relationship: 'Son',
    parents: ['fm-1', 'fm-2'],
    biography: 'Elementary school student who loves soccer and video games.',
    occupation: 'Student',
    location: 'San Francisco, CA'
  }, 
  
  {
    id: 'fm-9',
    name: 'Son',
    birthDate: '2013-05-18',
    profileImage: 'https://images.pexels.com/photos/1674666/pexels-photo-1674666.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    relationship: 'Spouse',
    parents: ['fm-3', 'fm-8'],
    biography: 'Elementary school student who loves soccer and video games.',
    occupation: 'Student',
    location: 'San Francisco, CA'
  }
];

export const mockEvents: Event[] = [
  {
    id: 'ev-1',
    title: 'Family Reunion 2024',
    description: 'Annual family gathering at Grandma Mary\'s house with barbecue and games.',
    date: '2024-07-15',
    type: 'reunion',
    participants: ['fm-1', 'fm-2', 'fm-3', 'fm-4', 'fm-6'],
    photos: [
      'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/1630344/pexels-photo-1630344.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
    ],
    location: 'Austin, TX',
    createdBy: '1',
    createdAt: '2024-07-16T10:00:00Z'
  },
  {
    id: 'ev-2',
    title: 'Emily\'s Art Exhibition',
    description: 'Emily\'s first solo art exhibition at the local community center.',
    date: '2024-05-20',
    type: 'achievement',
    participants: ['fm-1', 'fm-2', 'fm-3', 'fm-4'],
    photos: [
      'https://images.pexels.com/photos/1145720/pexels-photo-1145720.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
    ],
    location: 'San Francisco, CA',
    createdBy: '1',
    createdAt: '2024-05-21T15:30:00Z'
  },
  {
    id: 'ev-3',
    title: 'James\' Soccer Championship',
    description: 'James led his team to victory in the city championship.',
    date: '2024-06-10',
    type: 'achievement',
    participants: ['fm-1', 'fm-2', 'fm-4'],
    photos: [
      'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
    ],
    location: 'San Francisco, CA',
    createdBy: '2',
    createdAt: '2024-06-10T18:00:00Z'
  },
  {
    id: 'ev-4',
    title: 'Sarah & Michael\'s Anniversary',
    description: 'Celebrating 15 years of marriage with a romantic dinner.',
    date: '2024-08-12',
    type: 'wedding',
    participants: ['fm-1', 'fm-2'],
    photos: [
      'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
    ],
    location: 'Napa Valley, CA',
    createdBy: '1',
    createdAt: '2024-08-13T09:00:00Z'
  }
];

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'tl-1',
    title: 'Robert Johnson Sr. Born',
    date: '1955-11-30',
    description: 'Birth of the family patriarch in Austin, Texas.',
    type: 'birth',
    familyMemberId: 'fm-5'
  },
  {
    id: 'tl-2',
    title: 'Mary Johnson Born',
    date: '1958-02-14',
    description: 'Birth of our beloved grandmother on Valentine\'s Day.',
    type: 'birth',
    familyMemberId: 'fm-6'
  },
  {
    id: 'tl-3',
    title: 'Robert & Mary Wedding',
    date: '1980-06-15',
    description: 'Robert and Mary tied the knot in a beautiful ceremony.',
    type: 'marriage',
    relatedMembers: ['fm-5', 'fm-6']
  },
  {
    id: 'tl-4',
    title: 'Michael Johnson Born',
    date: '1983-07-22',
    description: 'The birth of Michael, first child of Robert and Mary.',
    type: 'birth',
    familyMemberId: 'fm-2'
  },
  {
    id: 'tl-5',
    title: 'Sarah Johnson Born',
    date: '1985-03-15',
    description: 'Sarah was born in San Francisco.',
    type: 'birth',
    familyMemberId: 'fm-1'
  },
  {
    id: 'tl-6',
    title: 'Sarah & Michael Wedding',
    date: '2009-08-12',
    description: 'Sarah and Michael got married in a beautiful outdoor ceremony.',
    type: 'marriage',
    relatedMembers: ['fm-1', 'fm-2']
  },
  {
    id: 'tl-7',
    title: 'Emily Johnson Born',
    date: '2010-12-08',
    description: 'The arrival of Emily, first daughter of Sarah and Michael.',
    type: 'birth',
    familyMemberId: 'fm-3'
  },
  {
    id: 'tl-8',
    title: 'James Johnson Born',
    date: '2013-05-18',
    description: 'James was born, completing the Johnson family.',
    type: 'birth',
    familyMemberId: 'fm-4'
  },
  {
    id: 'tl-9',
    title: 'Robert Johnson Sr. Passed Away',
    date: '2020-08-15',
    description: 'Our beloved patriarch passed away peacefully, leaving behind a legacy of love.',
    type: 'death',
    familyMemberId: 'fm-5'
  }
];