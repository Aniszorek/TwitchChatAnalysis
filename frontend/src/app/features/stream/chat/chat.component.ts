import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {ChatMessage, TwitchService} from '../../twitch/twitch.service';

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
  private readonly twitchService = inject(TwitchService);
  private readonly destroyRef = inject(DestroyRef)
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

    this.destroyRef.onDestroy(() => sub.unsubscribe())
  }

}
