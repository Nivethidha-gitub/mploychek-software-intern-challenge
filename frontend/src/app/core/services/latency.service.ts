import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/** One slider drives the ?delay= value sent on every API call. */
@Injectable({ providedIn: 'root' })
export class LatencyService {
  readonly ms$ = new BehaviorSubject<number>(2000);
  get value() { return this.ms$.value; }
}
