import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Subject, catchError, tap } from 'rxjs';
import { urls } from '../../app.config';
import { AuthService } from '../../auth/auth.service';
import { Message, NlpChatMessage } from './message';
import {hasAccess, Tab, UserRole} from './permissions.config';

export interface SearchUserState {
  success: boolean;
  message?: string;
}

interface SearchResponse {
  broadcaster_id: string;
  user_id: string;
  twitch_role: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class TwitchService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly backendUrl = urls.backendUrl;

  private readonly state = {
    broadcasterUsername: new BehaviorSubject<string | null>(null),
    broadcasterId: new BehaviorSubject<string | null>(null),
    userRole: new BehaviorSubject<UserRole | null>(null),
    userId: new BehaviorSubject<string | null>(null),
    searchUserState: new BehaviorSubject<SearchUserState | null>(null),
    loadingState: new BehaviorSubject<boolean>(false),
    chatMessages: new Subject<Message | null>(),
    nlpChatMessages: new Subject<NlpChatMessage | null>(),
  };

  chatMessages$ = this.state.chatMessages.asObservable();
  nlpChatMessages$ = this.state.nlpChatMessages.asObservable();
  searchUserState$ = this.state.searchUserState.asObservable();
  loadingState$ = this.state.loadingState.asObservable();

  private websocket: WebSocket | null = null;

  constructor() {
    this.authService.logout$.subscribe(() => this.disconnectWebSocket());
  }

  resetLoadingAndState(): void {
    this.state.broadcasterUsername.next(null);
    this.state.broadcasterId.next(null);
    this.state.userId.next(null);
    this.state.userRole.next(null);
    this.state.searchUserState.next(null);
    this.state.loadingState.next(false);
  }

  async searchUser(twitchUsername: string): Promise<void> {
    if (!twitchUsername) {
      this.updateSearchState(false, 'Username cannot be empty.');
      return;
    }

    const payload = this.createAuthPayload(twitchUsername);
    this.updateLoadingState(true);

    this.http
      .post<SearchResponse>(`${this.backendUrl}/set-twitch-username`, payload, this.getHttpOptions())
      .pipe(
        tap((response) => this.handleSearchSuccess(twitchUsername, response)),
        catchError((error) => {
          this.handleError(error);
          throw error;
        })
      )
      .subscribe();
  }

  disconnectWebSocket(): void {
    if (this.websocket) {
      console.log('Disconnecting WebSocket');
      this.websocket.close();
      this.websocket = null;
    }
    this.resetChatState();
  }

  canAccess(section: Tab): boolean {
    const userRole = this.state.userRole.getValue();
    return hasAccess(userRole, section);
  }

  private connectToWebSocket(): void {
    console.log('Connecting to WebSocket for Twitch chat');
    this.websocket = new WebSocket(`${this.backendUrl.replace('http', 'ws')}/chat`);

    this.websocket.onopen = () => {
      const idToken = this.authService.getIdToken();
      if (idToken) {
        this.websocket?.send(JSON.stringify({ type: 'auth', cognitoIdToken: idToken }));
      } else {
        console.error('No ID token available to authenticate WebSocket connection');
        this.disconnectWebSocket();
      }
    };

    this.websocket.onmessage = (event) => this.handleWebSocketMessage(event);
    this.websocket.onerror = (err) => console.log('WebSocket connection closed (on close)');
    this.websocket.onclose = () => console.log('WebSocket connection closed');
  }

  private handleSearchSuccess(username: string, response: SearchResponse): void {
    this.updateSearchState(true, `Connected to ${username}'s chat`);
    this.connectToWebSocket();

    this.updateState({
      broadcasterId: response.broadcaster_id,
      userId: response.user_id,
      userRole: response.twitch_role,
    });
  }

  private handleError(message: any, error?: any): void {
    console.error(message, error);
    this.updateSearchState(false, message.error.error);
    this.updateLoadingState(false);
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const rawMessage = JSON.parse(event.data);
      switch (rawMessage.type) {
        case 'initComplete':
          console.log('WebSocket initialization completed');
          this.updateLoadingState(false);
          break;
        case 'TwitchMessage':
          this.state.chatMessages.next(this.mapRawMessage(rawMessage.messageObject));
          break;
        case 'NlpMessage':
          this.state.nlpChatMessages.next(this.mapNlpMessage(rawMessage.messageObject));
          break;
        case 'MessageDeleted':
          //todo
          break;
        default:
          console.warn('Unknown message type:', rawMessage.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private updateState(updates: Partial<Record<keyof typeof this.state, any>>): void {
    for (const [key, value] of Object.entries(updates)) {
      const subject = this.state[key as keyof typeof this.state] as BehaviorSubject<any>;
      subject.next(value);
    }
  }

  private updateSearchState(success: boolean, message: string): void {
    this.state.searchUserState.next({ success, message });
  }

  private updateLoadingState(isLoading: boolean): void {
    this.state.loadingState.next(isLoading);
  }

  private resetChatState(): void {
    this.state.chatMessages.next(null);
    this.updateLoadingState(false);
  }

  private createAuthPayload(twitchUsername: string): Record<string, string | null> {
    return {
      twitchBroadcasterUsername: twitchUsername,
      cognitoIdToken: this.authService.getIdToken(),
      cognitoRefreshToken: this.authService.getRefreshToken(),
      cognitoTokenExpiryTime: this.authService.getExpiryDate(),
    };
  }

  private getHttpOptions(): { headers: HttpHeaders } {
    return { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  }

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

  private mapNlpMessage(rawMessage: any): NlpChatMessage {
    return {
      broadcasterUserLogin: rawMessage.broadcaster_user_login,
      chatUserLogin: rawMessage.chatter_user_login,
      messageId: rawMessage.message_id,
      messageText: rawMessage.message_text,
      nlpClassification: rawMessage.nlp_classification,
      streamId: rawMessage.stream_id,
      timestamp: rawMessage.timestamp
    };
  }
}
