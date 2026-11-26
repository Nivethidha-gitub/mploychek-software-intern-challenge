import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { LatencyService } from './core/services/latency.service';
import { SessionService } from './core/services/session.service';

@Component({
  selector: 'app-root',
  template: `
  <div class="app" [class.in]="!!(session.user$ | async)">
    <aside *ngIf="session.user$ | async as u">
      <div class="brand">Access Ledger</div>
      <nav>
        <a routerLink="/dashboard" routerLinkActive="on">Dashboard</a>
        <a *ngIf="u.role === 'Admin'" routerLink="/users" routerLinkActive="on">User management</a>
      </nav>
      <div class="me"><b>{{ u.name }}</b><span>{{ u.role }}</span><button class="ghost" (click)="auth.logout()">Sign out</button></div>
    </aside>
    <div class="main">
      <header *ngIf="session.user$ | async">
        <label class="lat">Simulated API delay <b>{{ latency.ms$ | async }} ms</b>
          <input type="range" min="0" max="8000" step="500" [value]="latency.value" (input)="latency.ms$.next(+$any($event.target).value)"></label>
      </header>
      <router-outlet></router-outlet>
    </div>
  </div>`
})
export class AppComponent { constructor(public session: SessionService, public auth: AuthService, public latency: LatencyService) {} }
