import {Injectable, signal} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, firstValueFrom, from, interval, map, Observable, of, Subject, Subscription, tap} from 'rxjs';
import {config, urls} from "../app.config";
import {LoadingService} from '../shared/services/loading.service';

interface AuthTokens {
  idToken: string;
  refreshToken: string;
  expiryTime: string;
}

interface RefreshedAuthTokens {
  id_token: string;
  access_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn = signal(false);

  private readonly logoutSubject = new Subject<void>();
  logout$ = this.logoutSubject.asObservable();

  private refreshSubscription?: Subscription;
  private refreshTimeoutId?: any;

  private readonly backendUrl = urls.backendUrl;
  private readonly cognitoLogoutUrl = urls.cognitoLogoutUrl;
  private readonly clientId = config.cognitoClientId;
  private readonly redirectUri = urls.cognitoLougoutRedirectUrl;

  constructor(private readonly http: HttpClient, private readonly loadingService: LoadingService) {}

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
    this.startTokenAutoRefresh()
  }

  /**
   * Logs out the user and clears the session.
   */
  logout(): void {
    this.clearLocalSession();
    this.logoutSubject.next();
    this.stopTokenAutoRefresh();
    window.location.href = this.getCognitoLogoutUrl();
  }

  /**
   * Initializes the user's session by validating tokens and navigating appropriately.
   */
  initializeSession(): void {
    this.loadingService.setLoading('auth', true);
    const tokens = this.getStoredTokens();

    if (!tokens) {
      console.log('No token found in localStorage.');
      this.finishLoading();
      return;
    }

    if (this.isTokenExpired(tokens.expiryTime)) {
      console.log('Token has expired. Trying to refresh it.');
      this.refreshCognitoTokens()
        .then(() => this.finishLoading())
        .catch(() => {
          this.clearLocalSession();
          this.finishLoading();
        });
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
    localStorage.removeItem('twitchOauth')
    this.isLoggedIn.set(false);
  }

  private isTokenExpired(expiryTime: string): boolean {
    return Date.now() >= Number(expiryTime);
  }

  private getCognitoLogoutUrl(): string {
    return `${this.cognitoLogoutUrl}?client_id=${this.clientId}&logout_uri=${encodeURIComponent(this.redirectUri)}`;
  }

  /**
   * Starts token refresh interval.
   */
  startTokenAutoRefresh(): void {
    if (this.refreshSubscription) {
      return;
    }

    const refreshIntervalMs = 15 * 60 * 1000;
    this.refreshSubscription = interval(refreshIntervalMs).subscribe(() => {
      this.refreshCognitoTokens();
    });

    this.scheduleTokenRefresh();

  }

  /**
   * Stops token refresh interval.
   */
  stopTokenAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }

    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = undefined;
    }
  }

  /**
   * Sets a timeout for token refresh.
   */
  private scheduleTokenRefresh(): void {
    const tokens = this.getStoredTokens();
    if (!tokens) {
      return;
    }

    const expiryTime = parseInt(this.getExpiryDate()!);
    const currentTime = Date.now();

    const timeToRefresh = expiryTime - currentTime - 5 * 60 * 1000;

    if (timeToRefresh <= 0) {
      this.refreshCognitoTokens();
      return;
    }

    this.refreshTimeoutId = setTimeout(() => {
      this.refreshCognitoTokens();
    }, timeToRefresh);
  }

  /**
   * Sends a request to the backend with a refresh token expecting new id_token in response
   */
  refreshCognitoTokens(): Promise<RefreshedAuthTokens | null> {
    const refreshToken = this.getRefreshToken();
    const expiryDate = this.getExpiryDate();
    if (!refreshToken || !expiryDate) {
      console.warn('No refresh token or expiry date available.');
      return Promise.resolve(null);
    }


    return new Promise((resolve, reject) => {
      this.http
        .post<RefreshedAuthTokens>(`${this.backendUrl}/refresh-cognito-tokens`, {refreshToken}, this.getHttpOptions())
        .pipe(
          tap((response) => {
            console.log('Token refresh successful:', response);
            this.saveTokens(response.id_token, refreshToken, response.expires_in.toString());
            resolve(response);
          }),
          catchError((error) => {
            const isTokenExpired = this.isTokenExpired(expiryDate);

            if (isTokenExpired) {
              console.warn('Refresh token has expired. Logging out.');
              this.logout();
            } else if (this.isNetworkError(error)) {
              console.warn('Network issue during token refresh. Retrying later.');
              setTimeout(() => this.refreshCognitoTokens(), 30000);
            } else {
              console.error('Token refresh failed due to server error. Logging out.', error);
              this.logout();
            }
            reject(error);
            throw error;
          })
        )
        .subscribe();
    });
  }

  private isNetworkError(error: any): boolean {
    return error?.status === 0 || error?.status === undefined;
  }

  private handleTokenValidation(response: { message: string }, tokens: AuthTokens): void {
    if (response.message === 'verified') {
      console.log('Token is valid. Updating session state.');
      this.saveTokens(tokens.idToken, tokens.refreshToken, tokens.expiryTime);
      this.isLoggedIn.set(true);
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
    this.loadingService.setLoading('auth', false);
  }

  saveOuathToken(token: string): void {
    localStorage.setItem('twitchOauth', token);
  }

  getOauthToken(): string|null {
    return localStorage.getItem('twitchOauth');
  }

  validateOrRefreshTokenObservable(): Observable<boolean> {
    const idToken = this.getIdToken();
    if (!idToken) {
      return of(false);
    }

    return this.validateToken(idToken).pipe(
      map(() => true),
      catchError(() =>
        from(this.refreshCognitoTokens()).pipe(
          map((tokens) => !!tokens),
          catchError(() => of(false))
        )
      )
    );
  }




  private getHttpOptions(): { headers: HttpHeaders } {
    return {headers: new HttpHeaders({'Content-Type': 'application/json'})};
  }
}
