import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ActivityService } from '../../core/services/activity.service';
import { Role } from '../../shared/models/models';

@Component({
  template: `
  <main class="login">
    <section class="hero">
      <h1>Access Ledger</h1>
      <p>One place to see who you are, what you can open, and what is held back for your role.</p>
    </section>
    <form [formGroup]="f" (ngSubmit)="submit()">
      <h2>Welcome back</h2>
      <label>User ID<input formControlName="userId" autocomplete="username"></label>
      <label>Password<input type="password" formControlName="password" autocomplete="current-password"></label>
      <label>Role<select formControlName="role"><option>General User</option><option>Admin</option></select></label>
      <p class="err" *ngIf="error" role="alert">{{ error }}</p>
      <button class="primary" [disabled]="f.invalid || busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      <small class="muted">Demo: admin001 / admin123 (Admin), user001 / user123 (General User)</small>
    </form>
  </main>`
})
export class LoginComponent {
  busy = false; error = '';
  f = this.fb.group({ userId: ['', Validators.required], password: ['', Validators.required], role: ['General User'] });
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private act: ActivityService) {}
  submit() {
    this.busy = true; this.error = ''; this.act.clear();
    this.auth.login(this.f.getRawValue() as { userId: string; password: string; role: Role })
      .pipe(finalize(() => (this.busy = false)))
      .subscribe({ next: () => this.router.navigate(['/dashboard']), error: e => (this.error = e.error?.message || 'Cannot reach the server. Is the API running on port 3000?') });
  }
}
