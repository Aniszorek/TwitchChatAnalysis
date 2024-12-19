import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {NotificationService} from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private readonly http: HttpClient, private readonly notificationService: NotificationService) {}


  getStreamMetadata(streamId: string, broadcasterUserLogin: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/aws/stream-metadata`, {
      headers: {
        broadcasterUserLogin: broadcasterUserLogin,
      },
      params: {
        stream_id: streamId,
      },
    }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error fetching stream metadata:', error);
        return throwError(() => new Error('Unable to fetch stream medatada. Please try again later.'));
      })
    );
  }

  getStreams(broadcasterUserLogin: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/aws/stream`, {
      headers: {
        broadcasterUserLogin: broadcasterUserLogin,
      }
    }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error fetching streams:', error.error.error);
        return throwError(() => new Error('Unable to fetch streams. Please try again later.'));
      })
    );
  }


  getSuspendedUsers(broadcasterId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/twitch/users/suspended`, {
      params: {
        broadcaster_id: broadcasterId,
      },
    }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error fetching suspended users:', error);
        return throwError(() => new Error('Unable to fetch suspended users. Please try again later.'));
      })
    );
  }

  banUser(broadcasterId: string, moderatorId: string, userId: string, data: BanData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/twitch/moderation/bans`, {
      broadcaster_id: broadcasterId,
      moderator_id: moderatorId,
      user_id: userId,
      data: data,
    }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error banning user:', error);
        return throwError(() => new Error('Unable to ban user. Please try again later.'));
      })
    );
  }

   unbanUser(broadcasterId: string, moderatorId: string, userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/twitch/moderation/bans`, {
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
        user_id: userId,
      },
    }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error unbanning user:', error);
        return throwError(() => new Error('Unable to unban user. Please try again later.'));
      })
    );
  }
}

export interface BanData {
  userId : String;
  duration: number | null;
  reason: string;
}

