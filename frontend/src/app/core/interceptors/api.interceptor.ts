import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { API } from '../api';
import { ActivityService } from '../services/activity.service';
import { LatencyService } from '../services/latency.service';
import { SessionService } from '../services/session.service';

/** Adds the JWT and the simulated ?delay=, records activity, and signs out on 401. */
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(private session: SessionService, private latency: LatencyService, private activity: ActivityService, private router: Router) {}
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith(API)) return next.handle(req);
    const token = this.session.token;
    const r = req.clone({ params: req.params.set('delay', this.latency.value), setHeaders: token ? { Authorization: `Bearer ${token}` } : {} });
    const key = this.activity.start(`${req.method} ${req.url.replace(API, '')}`);
    return next.handle(r).pipe(
      tap({ next: e => { if (e instanceof HttpResponse) this.activity.finish(key, 'done'); }, error: () => this.activity.finish(key, 'error') }),
      catchError((e: HttpErrorResponse) => {
        if (e.status === 401 && token) { this.session.clear(); this.router.navigate(['/login']); }
        return throwError(() => e);
      }));
  }
}
