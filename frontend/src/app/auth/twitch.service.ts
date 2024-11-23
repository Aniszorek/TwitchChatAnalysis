import {inject, Injectable} from '@angular/core';
import {urls} from '../app.config';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TwitchService {
  http = inject(HttpClient)
  backendUrl = urls.backendUrl
  private chatMessages = new Subject<ChatMessage>();
  chatMessages$ = this.chatMessages.asObservable();

  searchUser(twitchUsername: string): void {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const payload = { twitchUsername };

    this.http
      .post(`${this.backendUrl}/set-twitch-username`, payload, { headers })
      .subscribe({
        next: () => this.connectToChatWebSocket(),
        error: (err) => console.error('Failed to set Twitch username:', err),
      });
  }

  private connectToChatWebSocket() {
    const ws = new WebSocket(`${this.backendUrl.replace('http', 'ws')}/chat`);

    ws.onmessage = (event) => {
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
