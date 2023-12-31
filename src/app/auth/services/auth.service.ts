import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { environment } from 'src/environments/environments';

import {
  User,
  AuthStatus,
  LoginResponse,
  CheckTokenResponse,
} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {
    this.checkAuthStatus().subscribe();
  }
  private readonly baseUrl: string = environment.baseUrl;

  private http = inject(HttpClient);

  private _currentUser = signal<User | null>(null);
  private _authStatus = signal<AuthStatus>(AuthStatus.checking);

  public currentUser = computed(() => this._currentUser());
  public authStatus = computed(() => this._authStatus());

  private setAuthentication(user: User, token: string): boolean {
    this._currentUser.set(user);
    this._authStatus.set(AuthStatus.authenticated);

    localStorage.setItem(environment.TOKEN, token);

    return true;
  }

  login(email: string, password: string): Observable<boolean> {
    const url = `${this.baseUrl}/auth/login`;
    const body = { email, password };

    return this.http.post<LoginResponse>(url, body).pipe(
      map(({ user, token }) => this.setAuthentication(user, token)),
      catchError((err) => {
        return throwError(() => err.error.message);
      })
    );
  }

  register(name: string ,email: string, password: string): Observable<boolean> {
    const url = `${this.baseUrl}/auth/register`;
    const body = { name, email, password };

    return this.http.post<LoginResponse>(url, body).pipe(
      map(({ user, token }) => this.setAuthentication(user, token)),
      catchError((err) => {
        return throwError(() => err.error.message);
      })
    );
  }

  logout(): void {
    this._currentUser.set(null);
    this._authStatus.set(AuthStatus.notAuthenticated);
    localStorage.removeItem(environment.TOKEN);
  }

  checkAuthStatus(): Observable<boolean> {
    const url = `${this.baseUrl}/auth/check-token`;
    const token = localStorage.getItem(environment.TOKEN);

    if (!token) {
      this.logout();
      return of(false);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<CheckTokenResponse>(url, { headers }).pipe(
      map(({ user, token }) => this.setAuthentication(user, token)),
      catchError(() => {
        this._authStatus.set(AuthStatus.notAuthenticated);
        return of(false);
      })
    );
  }
}
