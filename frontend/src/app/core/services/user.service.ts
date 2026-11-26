import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API } from '../api';
import { NewUser, User } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}
  list() { return this.http.get<User[]>(`${API}/users`); }
  create(u: NewUser) { return this.http.post<User>(`${API}/users`, u); }
  update(id: string, patch: Partial<NewUser> & { status?: string }) { return this.http.put<User>(`${API}/users/${id}`, patch); }
  remove(id: string) { return this.http.delete(`${API}/users/${id}`); }
}
