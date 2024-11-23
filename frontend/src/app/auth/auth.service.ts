import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {config, urls} from "../app.config";

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
