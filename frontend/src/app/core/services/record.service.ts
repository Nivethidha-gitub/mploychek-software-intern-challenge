import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API } from '../api';
import { Rec } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class RecordService {
  constructor(private http: HttpClient) {}
  list() { return this.http.get<Rec[]>(`${API}/records`); }
}
