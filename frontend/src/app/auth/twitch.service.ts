import {inject, Injectable} from '@angular/core';
import {urls} from '../app.config';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, catchError, Subject, tap} from 'rxjs';

export interface SearchUserState {
  success: boolean;
  message?: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TwitchService {
  http = inject(HttpClient)
  backendUrl = urls.backendUrl
  private chatMessages = new Subject<ChatMessage>();
  chatMessages$ = this.chatMessages.asObservable();
  private searchUserState = new BehaviorSubject<SearchUserState | null>(null);
  searchUserState$ = this.searchUserState.asObservable();

  searchUser(twitchUsername: string): void {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const payload = { twitchUsername };

    console.log('Sending Twitch username to /set-twitch-username endpoint');
    this.http
      .post(`${this.backendUrl}/set-twitch-username`, payload, { headers })
      .pipe(
        tap(() => {
          this.searchUserState.next({ success: true, message: `Connected to ${twitchUsername}'s chat`});
          this.connectToChatWebSocket();
        }),
        catchError((error) => {
          console.error('Failed to set Twitch username:', error);
          this.searchUserState.next({
            success: false,
            errorMessage: 'Streamer not found. Please check the username and try again.',
          });
          throw error;
        })
      )
      .subscribe();
  }

  private connectToChatWebSocket() {
    console.log('connecting to backend via websocket to receive messages from twitch')
    const ws = new WebSocket(`${this.backendUrl.replace('http', 'ws')}/chat`);

    ws.onmessage = (event) => {
      const rawMessage = JSON.parse(event.data);
      const message: ChatMessage = {
        broadcasterUserId: rawMessage.broadcasterUserId,
        broadcasterUserLogin: rawMessage.broadcasterUserLogin,
        broadcasterUserName: rawMessage.broadcasterUserName,
        chatterUserId: rawMessage.chatterUserId,
        chatUserLogin: rawMessage.chatUserLogin,
        chatUserName: rawMessage.chatUserName,
        messageId: rawMessage.messageId,
        messageText: rawMessage.messageText,
        messageTimestamp: rawMessage.messageTimestamp
      };
      this.chatMessages.next(message);
    };

    ws.onerror = (err) => console.error('WebSocket error:', err);
  }
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
