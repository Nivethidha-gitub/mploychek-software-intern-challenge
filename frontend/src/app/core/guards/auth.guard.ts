import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private s: SessionService, private r: Router) {}
  canActivate() { return this.s.token ? true : this.r.parseUrl('/login'); }
}
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private s: SessionService, private r: Router) {}
  canActivate() { return this.s.isAdmin ? true : this.r.parseUrl('/dashboard'); }
}
