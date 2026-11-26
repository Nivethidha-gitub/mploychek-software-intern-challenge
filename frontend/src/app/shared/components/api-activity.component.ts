import { Component } from '@angular/core';
import { ActivityService } from '../../core/services/activity.service';

@Component({
  selector: 'app-api-activity',
  template: `
  <section class="card activity" aria-live="polite">
    <h3>API activity</h3>
    <p class="muted" *ngIf="!(act.calls$ | async)?.length">No calls yet.</p>
    <ul><li *ngFor="let c of act.calls$ | async" [attr.data-s]="c.state">
      <i class="dot"></i><code>{{ c.label }}</code>
      <b>{{ c.state === 'loading' ? 'waiting…' : c.state === 'error' ? 'failed' : c.ms + ' ms' }}</b>
    </li></ul>
  </section>`
})
export class ApiActivityComponent { constructor(public act: ActivityService) {} }
