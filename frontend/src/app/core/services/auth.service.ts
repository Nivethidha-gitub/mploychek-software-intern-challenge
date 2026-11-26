import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { API } from '../api';
import { Role, User } from '../../shared/models/models';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private session: SessionService, private router: Router) {}
  login(body: { userId: string; password: string; role: Role }) {
    return this.http.post<{ token: string; user: User }>(`${API}/auth/login`, body)
      .pipe(tap(r => this.session.start(r.token, r.user)));
  }
  profile() { return this.http.get<User>(`${API}/users/me`).pipe(tap(u => this.session.setUser(u))); }
  logout() { this.session.clear(); this.router.navigate(['/login']); }
}
