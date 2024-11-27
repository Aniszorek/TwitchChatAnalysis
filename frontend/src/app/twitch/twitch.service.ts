import {inject, Injectable} from '@angular/core';
import {urls} from '../app.config';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, catchError, Subject, tap} from 'rxjs';
import {AuthService} from "../auth/auth.service";

export interface SearchUserState {
  success: boolean;
  message?: string;
  errorMessage?: string;
}

export interface ChatMessage {
  broadcasterUserId: string,
  broadcasterUserLogin: string,
  broadcasterUserName: string,
  chatterUserId: string,
  chatUserLogin: string,
  chatUserName: string,
  messageId: string,
  messageText: string,
  messageTimestamp: string
}

@Injectable({
  providedIn: 'root'
})
export class TwitchService {
  http = inject(HttpClient)
  authService = inject(AuthService);
  backendUrl = urls.backendUrl
  private chatMessages = new Subject<ChatMessage | null>();
  chatMessages$ = this.chatMessages.asObservable();
  private searchUserState = new BehaviorSubject<SearchUserState | null>(null);
  searchUserState$ = this.searchUserState.asObservable();
  private loadingState = new BehaviorSubject<boolean>(false);
  loadingState$ = this.loadingState.asObservable();

  private websocket: WebSocket | null = null;


  constructor() {
    inject(AuthService).logout$.subscribe(() => {
      this.disconnectWebSocket();
    });
  }

  searchUser(twitchUsername: string): void {
    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    const payload = {
      twitchUsername: twitchUsername,
      cognitoIdToken: this.authService.getIdToken(),
      cognitoRefreshToken: this.authService.getRefreshToken(),
      cognitoTokenExpiryTime: this.authService.getExpiryDate(),
    };

    this.disconnectWebSocket();

    console.log('Sending Twitch username to /set-twitch-username endpoint');
    this.loadingState.next(true);

    this.http
      .post(`${this.backendUrl}/set-twitch-username`, payload, {headers})
      .pipe(
        tap(() => {
          this.searchUserState.next({success: true, message: `Connected to ${twitchUsername}'s chat`});
          this.connectToChatWebSocket();
        }),
        catchError((error) => {
          console.error('Failed to set Twitch username:', error);
          this.searchUserState.next({
            success: false,
            errorMessage: 'Streamer not found. Please check the username and try again.',
          });
          this.loadingState.next(false);
          throw error;
        })
      )
      .subscribe();
  }

  private connectToChatWebSocket() {
    console.log('connecting to backend via websocket to receive messages from twitch')
    this.websocket = new WebSocket(`${this.backendUrl.replace('http', 'ws')}/chat`)

    this.websocket.onopen = () => {
      const cognitoIdToken = this.authService.getIdToken();
      if (cognitoIdToken) {
        this.websocket?.send(JSON.stringify({ type: 'auth', cognitoIdToken }));
      } else {
        console.error('No ID token available to authenticate WebSocket connection');
      }
      this.loadingState.next(false);
    };

    this.websocket.onmessage = (event) => {
      const rawMessage = JSON.parse(event.data);
      const message: ChatMessage = {
        broadcasterUserId: rawMessage.broadcasterUserId,
        broadcasterUserLogin: rawMessage.broadcasterUserLogin,
        broadcasterUserName: rawMessage.broadcasterUserName,
        chatterUserId: rawMessage.chatterUserId,
        chatUserLogin: rawMessage.chatterUserLogin,
        chatUserName: rawMessage.chatterUserName,
        messageId: rawMessage.messageId,
        messageText: rawMessage.messageText,
        messageTimestamp: rawMessage.messageTimestamp
      };
      this.chatMessages.next(message);
    };

    this.websocket.onerror = (err) => console.error('WebSocket error:', err);
  }


  disconnectWebSocket(): void {
    if (this.websocket) {
      console.log('Disconnecting WebSocket');
      this.websocket.close();
      this.websocket = null;
    }
    this.chatMessages.next(null);
    this.loadingState.next(false);
  }
}
