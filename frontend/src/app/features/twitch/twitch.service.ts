import {inject, Injectable} from '@angular/core';
import {urls} from '../../app.config';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, catchError, Subject, tap} from 'rxjs';
import {AuthService} from '../../auth/auth.service';
import {Message, NlpChatMessage} from './message';

export interface SearchUserState {
  success: boolean;
  message?: string;
  errorMessage?: string;
}


@Injectable({
  providedIn: 'root',
})
export class TwitchService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly backendUrl = urls.backendUrl;
  private readonly twitchBroadcasterUsername = new BehaviorSubject<string | null>(null);

  private readonly chatMessages = new Subject<Message | null>();
  chatMessages$ = this.chatMessages.asObservable();

  private readonly nlpChatMessages = new Subject<NlpChatMessage | null>();
  nlpChatMessages$ = this.nlpChatMessages.asObservable();

  private readonly searchUserState = new BehaviorSubject<SearchUserState | null>(null);
  searchUserState$ = this.searchUserState.asObservable();

  private readonly loadingState = new BehaviorSubject<boolean>(false);
  loadingState$ = this.loadingState.asObservable();

  private websocket: WebSocket | null = null;

  constructor() {
    this.authService.logout$.subscribe(() => this.disconnectWebSocket());
  }

  setTwitchBroadcasterUsername(user: string | null) {
    this.twitchBroadcasterUsername.next(user);
  }

  getTwitchBroadcasterUsername() {
    return this.twitchBroadcasterUsername.getValue();
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
          // todo jak będziemy dostawać tutaj typ wiadomości to można to jakoś ładniej ograć
          const message: Message = this.mapRawMessage(rawMessage);
          if (message.broadcasterUserId)
            this.chatMessages.next(message);
          else this.nlpChatMessages.next(this.mapNlpMessage(rawMessage));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.websocket.onerror = (err) => console.error('WebSocket error:', err);
    this.websocket.onclose = () => console.log('WebSocket connection closed (on close)');
  }

  /**
   * Maps a raw WebSocket message to a Message object.
   */
  private mapRawMessage(rawMessage: any): Message {
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
   * Maps a raw WebSocket message to a NlpChatMessage object.
   */
  private mapNlpMessage(rawMessage: any): NlpChatMessage {
    return {
      broadcasterUserLogin: rawMessage.broadcaster_user_login,
      chatUserLogin: rawMessage.chatter_user_login,
      messageText: rawMessage.message_text,
      nlpClassification: rawMessage.nlp_classification,
      streamId: rawMessage.stream_id,
      timestamp: rawMessage.timestamp
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

  resetLoadingAndState(): void {
    this.setTwitchBroadcasterUsername(null);
    this.searchUserState.next(null);
    this.loadingState.next(false);
  }


  /**
   * Returns default HTTP options for API requests.
   */
  private getHttpOptions(): { headers: HttpHeaders } {
    return {headers: new HttpHeaders({'Content-Type': 'application/json'})};
  }
}
