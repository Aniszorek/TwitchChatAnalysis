import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {config, urls} from "../app.config";
import {catchError, map, Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  http = inject(HttpClient)
  backendUrl = urls.backendUrl
  isLoggedIn = signal(false);

  cognitoLogoutUrl = urls.cognitoLogoutUrl;
  clientId = config.cognitoClientId ;
  redirectUri = urls.cognitoLougoutRedirectUrl;


  initiateLogin() {
    window.location.href = this.backendUrl + '/auth-url';
  }

  saveTokens(idToken: string, refreshToken: string): void {
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('refreshToken', refreshToken);
    this.isLoggedIn.set(true);
  }

  validateToken(idToken: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.backendUrl}/verify-cognito`, { idToken });
  }




  private clearLocalSession(): void {
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    this.isLoggedIn.set(false);
  }

  logout(): void {
    this.clearLocalSession();
    const logoutUrl = `${this.cognitoLogoutUrl}?client_id=${this.clientId}&logout_uri=${encodeURIComponent(this.redirectUri)}`;
    console.log(logoutUrl);

    window.location.href = logoutUrl;
  }

  getIdToken(): string | null {
    return localStorage.getItem('idToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

}
