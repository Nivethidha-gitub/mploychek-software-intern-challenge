import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActivityService } from '../../core/services/activity.service';
import { SessionService } from '../../core/services/session.service';
import { UserService } from '../../core/services/user.service';
import { NewUser, Role, User } from '../../shared/models/models';

@Component({
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent {
  private refresh$ = new BehaviorSubject<void>(undefined);
  users$ = this.refresh$.pipe(switchMap(() => this.users.list())); // switchMap drops stale loads
  open = false; editing: User | null = null; saving = false; busyId = ''; error = '';
  f = this.fb.group({
    id: ['', Validators.required], name: ['', Validators.required], email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.minLength(6)], role: ['General User']
  });
  constructor(private fb: FormBuilder, private users: UserService, public session: SessionService, private act: ActivityService) { this.act.clear(); }

  add() { this.editing = null; this.f.reset({ role: 'General User' }); this.f.controls['id'].enable(); this.f.controls['password'].setValidators([Validators.required, Validators.minLength(6)]); this.f.controls['password'].updateValueAndValidity(); this.open = true; this.error = ''; }
  edit(u: User) { this.editing = u; this.f.reset({ ...u, password: '' }); this.f.controls['id'].disable(); this.f.controls['password'].setValidators(Validators.minLength(6)); this.f.controls['password'].updateValueAndValidity(); this.open = true; this.error = ''; }
  cancel() { this.open = false; }

  save() {
    const v = this.f.getRawValue(); this.saving = true; this.error = '';
    const call = this.editing
      ? this.users.update(this.editing.id, { name: v.name!, email: v.email!, role: v.role as Role, ...(v.password ? { password: v.password } : {}) })
      : this.users.create(v as NewUser);
    call.subscribe({ next: () => { this.saving = false; this.open = false; this.refresh$.next(); }, error: e => this.fail(e) });
  }
  toggle(u: User) { this.busyId = u.id; this.run(this.users.update(u.id, { status: u.status === 'Active' ? 'Inactive' : 'Active' })); }
  remove(u: User) { if (confirm(`Delete ${u.name} (${u.id})? Their records are removed too.`)) { this.busyId = u.id; this.run(this.users.remove(u.id)); } }
  private run(call: import('rxjs').Observable<unknown>) { this.error = ''; call.subscribe({ next: () => { this.busyId = ''; this.refresh$.next(); }, error: e => this.fail(e) }); }
  private fail(e: any) { this.saving = false; this.busyId = ''; this.error = e.error?.message || 'Request failed. Check the API is running.'; }
}
