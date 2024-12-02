import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {ChatMessage, TwitchService} from '../../twitch/twitch.service';
import {DatePipe, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-stream-chat',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    DatePipe
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  private twitchService = inject(TwitchService);
  private destroyRef = inject(DestroyRef)
  messages: ChatMessage[] = [];

  ngOnInit() {

    const sub = this.twitchService.chatMessages$.subscribe((message) => {
        if (message) {
          this.messages.push(message);
        } else {
          this.messages = [];
        }
      }
    );

    this.destroyRef.onDestroy(sub.unsubscribe)
  }

}
