import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {urls} from "../app.config";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  http = inject(HttpClient)
  backendUrl = urls.backendUrl
  isLoggedIn = signal(false);

  initiateLogin(){
    window.location.href = this.backendUrl + '/auth-url';
  }

  saveTokens(idToken: string, refreshToken: string): void {
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('refreshToken', refreshToken);
    this.isLoggedIn.set(true);
  }

  getIdToken(): string | null {
    return localStorage.getItem('idToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
}
