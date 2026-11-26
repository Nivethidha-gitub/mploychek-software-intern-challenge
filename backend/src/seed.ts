import bcrypt from 'bcryptjs';
import { Rec, User } from './repo';

const h = (p: string) => bcrypt.hashSync(p, 8);
export const seedUsers = (): User[] => [
  { id: 'admin001', name: 'Karthik Raman', email: 'karthik@example.com', password: h('admin123'), role: 'Admin', status: 'Active' },
  { id: 'user001', name: 'Arun Kumar', email: 'arun@example.com', password: h('user123'), role: 'General User', status: 'Active' },
  { id: 'user002', name: 'Priya Sundar', email: 'priya@example.com', password: h('user123'), role: 'General User', status: 'Active' },
  { id: 'user003', name: 'Divya Menon', email: 'divya@example.com', password: h('user123'), role: 'General User', status: 'Inactive' }
];
export const seedRecords = (): Rec[] => [
  { id: 'REC001', description: 'Application', status: 'Active', ownerId: 'user001', level: 1 },
  { id: 'REC002', description: 'Profile update', status: 'Pending', ownerId: 'user001', level: 1 },
  { id: 'REC003', description: 'Document verification', status: 'Completed', ownerId: 'user001', level: 2 },
  { id: 'REC004', description: 'Leave request', status: 'Pending', ownerId: 'user002', level: 1 },
  { id: 'REC005', description: 'Expense claim', status: 'Active', ownerId: 'user002', level: 2 },
  { id: 'REC006', description: 'Access review', status: 'Completed', ownerId: 'admin001', level: 3 },
  { id: 'REC007', description: 'Vendor onboarding', status: 'Active', ownerId: 'admin001', level: 2 },
  { id: 'REC008', description: 'Training enrolment', status: 'Pending', ownerId: 'user003', level: 1 }
];
