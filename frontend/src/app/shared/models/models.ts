export type Role = 'General User' | 'Admin';
export type Status = 'Active' | 'Inactive';
export interface User { id: string; name: string; email: string; role: Role; status: Status; accessLevel: number; accessName: string; }
export interface NewUser { id: string; name: string; email: string; password: string; role: Role; }
export interface Rec { id: string; description: string; status: string; ownerId: string; level: number; levelName: string; accessible: boolean; }
export interface ApiCall { key: number; label: string; state: 'loading' | 'done' | 'error'; ms?: number; t0: number; }
