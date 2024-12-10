import {inject, Injectable} from '@angular/core';
import {urls} from '../../app.config';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, catchError, Subject, tap} from 'rxjs';
import {AuthService} from '../../auth/auth.service';

export interface SearchUserState {
  success: boolean;
  message?: string;
  errorMessage?: string;
}

export interface ChatMessage {
  broadcasterUserId: string;
  broadcasterUserLogin: string;
  broadcasterUserName: string;
  chatterUserId: string;
  chatUserLogin: string;
  chatUserName: string;
  messageId: string;
  messageText: string;
  messageTimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class TwitchService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly backendUrl = urls.backendUrl;
  private readonly twitchUsername = new BehaviorSubject<string | null>(null);
  user$ = this.twitchUsername.asObservable();

  private readonly chatMessages = new Subject<ChatMessage | null>();
  chatMessages$ = this.chatMessages.asObservable();

  private readonly searchUserState = new BehaviorSubject<SearchUserState | null>(null);
  searchUserState$ = this.searchUserState.asObservable();

  private readonly loadingState = new BehaviorSubject<boolean>(false);
  loadingState$ = this.loadingState.asObservable();

  private websocket: WebSocket | null = null;

  constructor() {
    this.authService.logout$.subscribe(() => this.disconnectWebSocket());
  }

  setTwitchUsername(user: string) {
    this.twitchUsername.next(user);
  }

  getTwitchUsername() {
    return this.twitchUsername.getValue();
  }

  /**
   * Searches for a Twitch user and connects to their chat.
   */
  async searchUser(twitchUsername: string): Promise<void> {
    if (!twitchUsername) {
      this.searchUserState.next({success: false, errorMessage: 'Username cannot be empty.'});
      return;
    }

    const payload = this.createAuthPayload(twitchUsername);
    this.startLoading();
    this.sendUsernameToBackend(payload, twitchUsername);
  }

  /**
   * Starts the loading state.
   */
  private startLoading(): void {
    this.loadingState.next(true);
  }

  /**
   * Sends the username to the backend API to set the Twitch username.
   */
  private sendUsernameToBackend(payload: any, twitchUsername: string): void {
    this.chatMessages.next(null);
    this.http
      .post(`${this.backendUrl}/set-twitch-username`, payload, this.getHttpOptions())
      .pipe(
        tap(() => {
          this.handleSearchSuccess(twitchUsername);
        }),
        catchError((error) => {
          this.handleSearchError(error);
          throw error;
        })
      )
      .subscribe();
  }

  /**
   * Handles a successful search response.
   */
  private handleSearchSuccess(twitchUsername: string): void {
    this.searchUserState.next({success: true, message: `Connected to ${twitchUsername}'s chat`});
    this.connectToChatWebSocket();
  }

  /**
   * Handles an error that occurs during the search.
   */
  private handleSearchError(error: any): void {
    console.error('Failed to set Twitch username:', error);
    this.searchUserState.next({
      success: false,
      errorMessage: 'Streamer not found. Please check the username and try again.',
    });
    this.loadingState.next(false);
  }

  /**
   * Disconnects the WebSocket connection.
   */
  disconnectWebSocket(): void {
    if (this.websocket) {
      console.log('Disconnecting WebSocket');
      this.websocket.close();
      this.websocket = null;
    }
    this.chatMessages.next(null);
    this.loadingState.next(false);
  }

  /**
   * Connects to the backend WebSocket to receive Twitch chat messages.
   */
  private connectToChatWebSocket(): void {
    console.log('Connecting to backend via WebSocket for Twitch chat');
    this.websocket = new WebSocket(`${this.backendUrl.replace('http', 'ws')}/chat`);

    this.websocket.onopen = () => {
      const cognitoIdToken = this.authService.getIdToken();
      if (cognitoIdToken) {
        this.websocket?.send(JSON.stringify({type: 'auth', cognitoIdToken}));
      } else {
        console.error('No ID token available to authenticate WebSocket connection');
        this.disconnectWebSocket();
      }
    };

    this.websocket.onmessage = (event) => {
      try {
        const rawMessage = JSON.parse(event.data);
        console.log(rawMessage);
        if (rawMessage.type == 'initComplete') {
          console.log('WebSocket initialization completed');
          this.loadingState.next(false);
        } else {
          const message: ChatMessage = this.mapRawMessage(rawMessage);
          this.chatMessages.next(message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.websocket.onerror = (err) => console.error('WebSocket error:', err);
    this.websocket.onclose = () => console.log('WebSocket connection closed (on close)');
  }

  /**
   * Maps a raw WebSocket message to a ChatMessage object.
   */
  private mapRawMessage(rawMessage: any): ChatMessage {
    return {
      broadcasterUserId: rawMessage.broadcasterUserId,
      broadcasterUserLogin: rawMessage.broadcasterUserLogin,
      broadcasterUserName: rawMessage.broadcasterUserName,
      chatterUserId: rawMessage.chatterUserId,
      chatUserLogin: rawMessage.chatterUserLogin,
      chatUserName: rawMessage.chatterUserName,
      messageId: rawMessage.messageId,
      messageText: rawMessage.messageText,
      messageTimestamp: rawMessage.messageTimestamp,
    };
  }

  /**
   * Creates the authentication payload for API requests.
   */
  private createAuthPayload(twitchUsername: string): Record<string, string | null> {
    return {
      twitchBroadcasterUsername: twitchUsername,
      cognitoIdToken: this.authService.getIdToken(),
      cognitoRefreshToken: this.authService.getRefreshToken(),
      cognitoTokenExpiryTime: this.authService.getExpiryDate(),
    };
  }

  /**
   * Returns default HTTP options for API requests.
   */
  private getHttpOptions(): { headers: HttpHeaders } {
    return {headers: new HttpHeaders({'Content-Type': 'application/json'})};
  }
}
