import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  http = inject(HttpClient)
  private authUrl = 'http://localhost:3000'


  exchangeCodeForToken(code: string): Observable<any> {
    return this.http.get<any>(`${this.authUrl}/callback?code=${code}`);
  }
}
