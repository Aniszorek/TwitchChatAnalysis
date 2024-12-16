import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StreamService {
  private readonly apiUrl = 'http://localhost:3000/aws';

  constructor(private readonly http: HttpClient) {}

  getStreamMetadata(streamId: string, broadcasterUserLogin: string, authorization: string | null): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stream-metadata`, {
      headers: {
        broadcasterUserLogin: broadcasterUserLogin,
        //Authorization: 'Bearer ' + authorization, // todo niepotrzebne, teraz header authorization jest ustawiany w interceptorze
      },
      params: {
        stream_id: streamId,
      },
    });
  }

  getStreams(broadcasterUserLogin: string, authorization: string | null): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stream`, {
      headers: {
        broadcasterUserLogin: broadcasterUserLogin,
        //Authorization: 'Bearer ' + authorization, // todo te same uwagi co wyzej
      }
    });
  }
}
