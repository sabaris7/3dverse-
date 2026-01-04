import { Project, User, Comment } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Rivera',
  avatar: 'https://picsum.photos/seed/alex/64/64',
  color: '#C7F000', // Lime
  role: 'admin',
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Turbine Housing v2.4',
    thumbnail: 'https://picsum.photos/seed/turbine/400/300',
    lastModified: '2h ago',
    status: 'In Review',
    owner: 'Engineering Team',
    activeUsers: 3,
  },
  {
    id: 'p2',
    name: 'Suspension Arm Gen3',
    thumbnail: 'https://picsum.photos/seed/suspension/400/300',
    lastModified: '1d ago',
    status: 'Open',
    owner: 'Sarah Chen',
    activeUsers: 0,
  },
  {
    id: 'p3',
    name: 'Main Assembly Unit',
    thumbnail: 'https://picsum.photos/seed/assembly/400/300',
    lastModified: '3d ago',
    status: 'Approved',
    owner: 'Manufacturing',
    activeUsers: 1,
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    projectId: 'p1',
    userId: 'u2',
    text: 'The wall thickness here looks insufficient for the thermal stress loads.',
    createdAt: '10m ago',
    position: [1.2, 0.5, 0.5],
    status: 'open',
    replies: [
      {
        id: 'c1-r1',
        projectId: 'p1',
        userId: 'u1',
        text: 'Agreed. I will increase it to 4mm in the next revision.',
        createdAt: '2m ago',
        status: 'open',
      }
    ]
  },
  {
    id: 'c2',
    projectId: 'p1',
    userId: 'u3',
    text: 'Check interference with the mounting bracket.',
    createdAt: '1h ago',
    position: [-0.8, -0.2, 0.0],
    status: 'resolved',
  }
];

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  { id: 'u2', name: 'Sarah Chen', avatar: 'https://picsum.photos/seed/sarah/64/64', color: '#FF4757', role: 'reviewer' },
  { id: 'u3', name: 'Mike Ross', avatar: 'https://picsum.photos/seed/mike/64/64', color: '#2ED573', role: 'viewer' },
];

export const ANALYTICS_DATA = [
  { name: 'Mon', duration: 20 },
  { name: 'Tue', duration: 45 },
  { name: 'Wed', duration: 30 },
  { name: 'Thu', duration: 60 },
  { name: 'Fri', duration: 55 },
  { name: 'Sat', duration: 15 },
  { name: 'Sun', duration: 10 },
];
