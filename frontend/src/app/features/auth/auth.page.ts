import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'pp-auth-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.page.html',
})
export class AuthPageComponent {
  readonly mode = signal<'login' | 'signup'>('login');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');

  get nameValue(): string { return this.name(); }
  set nameValue(value: string) { this.name.set(value); }
  get emailValue(): string { return this.email(); }
  set emailValue(value: string) { this.email.set(value); }
  get passwordValue(): string { return this.password(); }
  set passwordValue(value: string) { this.password.set(value); }
  get confirmPasswordValue(): string { return this.confirmPassword(); }
  set confirmPasswordValue(value: string) { this.confirmPassword.set(value); }

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  setMode(mode: 'login' | 'signup'): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  submit(): void {
    if (this.busy()) return;
    if (this.mode() === 'signup' && this.password() !== this.confirmPassword()) {
      this.error.set('Those passwords do not match.');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    const request = this.mode() === 'signup'
      ? this.auth.register(this.name(), this.email(), this.password())
      : this.auth.login(this.email(), this.password());

    request.subscribe({
      next: () => {
        const destination = this.route.snapshot.queryParamMap.get('returnUrl') || '/overview';
        void this.router.navigateByUrl(destination);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.error.set(this.messageFor(error));
      },
    });
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = error.error?.detail ?? error.error?.message;
      if (typeof detail === 'string') return detail;
      if (error.status === 0) return 'PortfolioPro could not reach the account service. Try again shortly.';
      if (error.status === 400) return 'Check your name, email, and password, then try again.';
    }
    return 'We could not complete that request. Please try again.';
  }
}