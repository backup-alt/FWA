import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User, JwtPayload } from '../models/auth.model';

const TOKEN_KEY = 'ram_finance_token';
const USER_KEY = 'ram_finance_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initAuth();
  }

  private initAuth(): void {
    const token = this.getToken();
    if (token) {
      try {
        const payload = this.decodeToken(token);
        if (payload && !this.isTokenExpired(payload)) {
          this.userSubject.next({
            id: payload.id,
            username: payload.username,
            role: payload.role
          });
          this.isAuthenticatedSubject.next(true);
          return;
        }
      } catch (e) {
        console.warn('Invalid token on init, clearing auth');
      }
    }
    this.clearAuthState();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response?.token) {
          this.setToken(response.token);
          this.setUser(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  logout(): Observable<void> {
    const token = this.getToken();
    if (token) {
      return this.http.post<void>(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
        tap(() => this.clearAuthState())
      );
    }
    this.clearAuthState();
    return of(void 0);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return this.userSubject.value;
  }

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  clearAuthState(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }

  isTokenExpired(payload: JwtPayload): boolean {
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Warm up the backend on app start (for Render free tier cold start)
  warmupBackend(): Observable<void> {
    if (environment.production) {
      return this.http.get<void>(environment.apiBaseUrl.replace('/api', ''), { responseType: 'text' as 'json' }).pipe(
        catchError(() => new Observable<void>(observer => observer.complete()))
      );
    }
    return of(void 0);
  }
}
