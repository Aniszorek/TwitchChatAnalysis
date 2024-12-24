import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, tap, throwError} from 'rxjs';
import {NotificationService} from './notification.service';
import {GetCategoriesResponse} from './models/categories-response';
import {ChannelInfoRequest} from './models/channel-info-request';
import {AutoModSettingsRequest} from './models/auto-mod-settings-reqeuest';
import {AutoModSettingsResponse} from './models/auto-mod-settings-response';
import {PostBlockedTermRequest} from './models/blocked-terms-request';
import {BlockedTerm} from './models/blocked-term';
import {PostBlockedTermsResponse} from './models/blocked-terms-response';

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
      tap(() => {
        this.notificationService.sendSuccessMessage('User banned successfully!');
      }),
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
      tap(() => {
        this.notificationService.sendSuccessMessage('User unbaned successfully!');
      }),
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error unbanning user:', error);
        return throwError(() => new Error('Unable to unban user. Please try again later.'));
      })
    );
  }

  getModerators(broadcasterId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/twitch/moderation/moderators`, {
      params: {
        broadcaster_id: broadcasterId
      },
    }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error fetching moderators:', error);
        return throwError(() => new Error('Unable to fetch moderators. Please try again later.'));
      })
    );
  }

  removeModerator(broadcasterId: string, userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/twitch/moderation/moderators`, {
      params: {
        broadcaster_id: broadcasterId,
        user_id: userId
      },
    }).pipe(
      tap(() => {
        this.notificationService.sendSuccessMessage('Moderator removed successfully!');
      }),
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error removing moderator:', error);
        return throwError(() => new Error('Unable to remove moderator. Please try again later.'));
      })
    );
  }

  getVips(broadcasterId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/twitch/channels/vips`, {
      params: {
        broadcaster_id: broadcasterId
      },
    }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error getting vips:', error);
        return throwError(() => new Error('Unable to getting vips. Please try again later.'));
      })
    );
  }

  removeVip(broadcasterId: string, userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/twitch/moderation/vips`, {
      params: {
        broadcaster_id: broadcasterId,
        user_id: userId
      },
    }).pipe(
      tap(() => {
        this.notificationService.sendSuccessMessage('Vip removed successfully!');
      }),
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error removing vip:', error);
        return throwError(() => new Error('Unable to remove vip. Please try again later.'));
      })
    );
  }

  getChannelInformation(broadcasterId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/twitch/channels`, {
      params: {
        broadcaster_id: broadcasterId,
      },
    }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error getting channel information:', error);
        return throwError(() => new Error('Unable to get channel information. Please try again later.'));
      })
    );
  }

  patchChannelInformation(broadcasterId: string, body: ChannelInfoRequest) {
    return this.http.patch<any>(`${this.apiUrl}/twitch/channels`,
      body,
      {
      params: {
        broadcaster_id: broadcasterId,
      },
    }).pipe(
      tap(() => {
        this.notificationService.sendSuccessMessage('Channel information updated successfully!');
      }),
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error changing channel information:', error);
        return throwError(() => new Error('Unable to change channel information. Please try again later.'));
      })
    );
  }

  searchCategories(query: string) {
    return this.http.get<GetCategoriesResponse>(`${this.apiUrl}/twitch/search/categories`, {
        params: {
          query: query
        },
      }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error searching categories:', error);
        return throwError(() => new Error('Unable to search categories. Please try again later.'));
      })
    );
  }

  getAutomodSettings(broadcasterId: string, moderatorId: string) {
    return this.http.get<AutoModSettingsResponse>(`${this.apiUrl}/twitch/moderation/automod/settings`, {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId
        },
      }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error getting automod settings:', error);
        return throwError(() => new Error('Unable to get automod settings. Please try again later.'));
      })
    );
  }

  putAutomodSettings(broadcasterId: string, moderatorId: string, body: Partial<AutoModSettingsRequest>) {
    return this.http.put<AutoModSettingsResponse>(`${this.apiUrl}/twitch/moderation/automod/settings`, body,{
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId
        },
      }).pipe(
      tap(() => {
        this.notificationService.sendSuccessMessage('Auto-mod settings updated successfully!');
      }),
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error updating automod settings:', error);
        return throwError(() => new Error('Unable to updating automod settings. Please try again later.'));
      })
    );
  }

  getBlockedTerms(broadcasterId: string, moderatorId: string) {
    return this.http.get<BlockedTerm[]>(`${this.apiUrl}/twitch/moderation/blocked_terms`,{
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId
        },
      }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error getting blocked terms:', error);
        return throwError(() => new Error('Unable to getting blocked terms. Please try again later.'));
      })
    );
  }

  postBlockedTerm(broadcasterId: string, moderatorId: string, body: PostBlockedTermRequest) {
    return this.http.post<PostBlockedTermsResponse>(`${this.apiUrl}/twitch/moderation/blocked_terms`, body, {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId
        },
      }).pipe(
      tap(() => {
        this.notificationService.sendSuccessMessage('Blocked term added successfully!');
      }),
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error adding blocked term:', error);
        return throwError(() => new Error('Unable to adding blocked term. Please try again later.'));
      })
    );
  }

  deleteBlockedTerm(broadcasterId: string, moderatorId: string, id: string) {
    return this.http.delete<any>(`${this.apiUrl}/twitch/moderation/blocked_terms`, {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId,
          id: id
        },
      }).pipe(
      tap(() => {
        this.notificationService.sendSuccessMessage('Blocked term deleted successfully!');
      }),
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error deleting blocked term:', error);
        return throwError(() => new Error('Unable to delete blocked term. Please try again later.'));
      })
    );
  }


  sendTwitchMessage(broadcasterId: string, userId: string, message: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/twitch/chat/messages`, {
      broadcaster_id: broadcasterId,
      sender_id: userId,
      message: message
    }).pipe(
      catchError((error) => {
        this.notificationService.sendMessage(error.error.error);
        console.error('Error sending Twitch message:', error);
        return throwError(() => new Error('Unable to send Twitch message. Please try again later.'));
      })
    );
  }
}

export interface BanData {
  user_id : String;
  duration: number | null;
  reason: string;
}
