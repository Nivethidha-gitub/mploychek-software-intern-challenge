import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../../shared/models/models';

/** Holds the signed-in user and JWT. No HttpClient here, so the interceptor can use it safely. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private read(): User | null { try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; } }
  readonly user$ = new BehaviorSubject<User | null>(this.read());
  get token() { return sessionStorage.getItem('token'); }
  get user() { return this.user$.value; }
  get isAdmin() { return this.user?.role === 'Admin'; }
  start(token: string, user: User) { sessionStorage.setItem('token', token); this.setUser(user); }
  setUser(user: User) { sessionStorage.setItem('user', JSON.stringify(user)); this.user$.next(user); }
  clear() { sessionStorage.clear(); this.user$.next(null); }
}
