import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { config, urls } from "../app.config";

interface AuthTokens {
  idToken: string;
  refreshToken: string;
  expiryTime: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoggedIn = signal(false);

  private logoutSubject = new Subject<void>();
  logout$ = this.logoutSubject.asObservable();

  private readonly backendUrl = urls.backendUrl;
  private readonly cognitoLogoutUrl = urls.cognitoLogoutUrl;
  private readonly clientId = config.cognitoClientId;
  private readonly redirectUri = urls.cognitoLougoutRedirectUrl;

  constructor(private router: Router, private http: HttpClient) {}

  /**
   * Starts the login process by redirecting to the backend authorization URL.
   */
  initiateLogin(): void {
    window.location.href = `${this.backendUrl}/auth-url`;
  }

  /**
   * Saves tokens to localStorage and updates the login state.
   */
  saveTokens(idToken: string, refreshToken: string, expiryTime: string): void {
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('expireTime', expiryTime);
    this.isLoggedIn.set(true);
  }

  /**
   * Logs out the user and clears the session.
   */
  logout(): void {
    this.clearLocalSession();
    this.logoutSubject.next();
    window.location.href = this.getCognitoLogoutUrl();
  }

  /**
   * Initializes the user's session by validating tokens and navigating appropriately.
   */
  initializeSession(): void {
    const tokens = this.getStoredTokens();

    if (!tokens) {
      console.log('No token found in localStorage.');
      this.finishLoading();
      return;
    }

    if (this.isTokenExpired(tokens.expiryTime)) {
      console.log('Token has expired. Clearing session.');
      this.clearLocalSession();
      this.finishLoading();
      return;
    }

    this.validateToken(tokens.idToken).subscribe({
      next: (response) => this.handleTokenValidation(response, tokens),
      error: (err) => this.handleTokenValidationError(err),
    });
  }

  /**
   * Validates the given ID token with the backend.
   */
  validateToken(idToken: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.backendUrl}/verify-cognito`, { idToken });
  }

  /**
   * Returns stored tokens from localStorage.
   */
  getStoredTokens(): AuthTokens | null {
    const idToken = this.getIdToken();
    const refreshToken = this.getRefreshToken();
    const expiryTime = this.getExpiryDate();

    return idToken && refreshToken && expiryTime
      ? { idToken, refreshToken, expiryTime }
      : null;
  }

    /**
   * Gets the ID token from localStorage.
   */
  getIdToken(): string | null {
    return localStorage.getItem('idToken');
  }

  /**
   * Gets the refresh token from localStorage.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Gets the expiry time of the token from localStorage.
   */
  getExpiryDate(): string | null {
    return localStorage.getItem('expireTime');
  }

  /**
   * Clears session from localStorage.
   */
  private clearLocalSession(): void {
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expireTime');
    this.isLoggedIn.set(false);
  }

  private isTokenExpired(expiryTime: string): boolean {
    return new Date() >= new Date(expiryTime);
  }

  private getCognitoLogoutUrl(): string {
    return `${this.cognitoLogoutUrl}?client_id=${this.clientId}&logout_uri=${encodeURIComponent(this.redirectUri)}`;
  }

  private handleTokenValidation(response: { message: string }, tokens: AuthTokens): void {
    if (response.message === 'verified') {
      console.log('Token is valid. Redirecting to /stream.');
      this.saveTokens(tokens.idToken, tokens.refreshToken, tokens.expiryTime);
      this.router.navigate(['/stream']);
    } else {
      console.log('Token validation failed. Clearing session.');
      this.clearLocalSession();
    }
    this.finishLoading();
  }

  private handleTokenValidationError(err: any): void {
    console.log('Token validation failed. Clearing session.', err);
    this.clearLocalSession();
    this.finishLoading();
  }

  private finishLoading(): void {
    this.isLoading.next(false);
  }
}
