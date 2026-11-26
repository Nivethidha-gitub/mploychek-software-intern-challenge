import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiCall } from '../../shared/models/models';

/** Tracks in-flight and finished API calls so the UI can show async progress. */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  readonly calls$ = new BehaviorSubject<ApiCall[]>([]);
  private n = 0;
  start(label: string) {
    const key = ++this.n;
    this.calls$.next([...this.calls$.value, { key, label, state: 'loading' as const, t0: performance.now() }].slice(-8));
    return key;
  }
  finish(key: number, state: 'done' | 'error') {
    this.calls$.next(this.calls$.value.map(c => (c.key === key ? { ...c, state, ms: Math.round(performance.now() - c.t0) } : c)));
  }
  clear() { this.calls$.next([]); }
}
