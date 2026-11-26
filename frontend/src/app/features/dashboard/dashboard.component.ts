import { Component } from '@angular/core';
import { of } from 'rxjs';
import { ActivityService } from '../../core/services/activity.service';
import { AuthService } from '../../core/services/auth.service';
import { RecordService } from '../../core/services/record.service';
import { SessionService } from '../../core/services/session.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../shared/models/models';

/** Three independent streams: each panel renders the moment its own API call returns. */
@Component({
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  me$ = this.auth.profile();
  records$ = this.records.list();
  users$ = this.session.isAdmin ? this.users.list() : of(null as User[] | null);
  constructor(public session: SessionService, private auth: AuthService, private records: RecordService,
              private users: UserService, private act: ActivityService) { this.act.clear(); }
  isActive = (u: User) => u.status === 'Active';
  isAdmin = (u: User) => u.role === 'Admin';
  count(list: User[], f: (u: User) => boolean) { return list.filter(f).length; }
}
