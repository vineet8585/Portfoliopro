import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthUser | null>(null);
  private sessionCheck: Promise<boolean> | null = null;

  constructor(private readonly http: HttpClient) {}

  checkSession(): Promise<boolean> {
    if (this.user()) return Promise.resolve(true);
    if (this.sessionCheck) return this.sessionCheck;

    this.sessionCheck = firstValueFrom(
      this.http.get<AuthUser | null>('/api/auth/me').pipe(catchError(() => of(null))),
    )
      .then((user) => {
        this.user.set(user);
        return user !== null;
      })
      .finally(() => {
        this.sessionCheck = null;
      });
    return this.sessionCheck;
  }

  login(email: string, password: string) {
    return this.http.post<AuthUser>('/api/auth/login', { email, password }).pipe(
      tap((user) => this.user.set(user)),
    );
  }

  register(name: string, email: string, password: string) {
    return this.http.post<AuthUser>('/api/auth/register', { name, email, password }).pipe(
      tap((user) => this.user.set(user)),
    );
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/logout', {}));
    } catch {
      // Clear local state even when the API is unavailable.
    } finally {
      this.user.set(null);
      window.location.assign('/login');
    }
  }
}