import {Component, inject, OnInit} from '@angular/core';
import {ChatMessage, TwitchService} from '../../twitch/twitch.service';
import {DatePipe, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    DatePipe
  ],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css'
})
export class ChatWidgetComponent implements OnInit {
  private twitchService = inject(TwitchService);
  messages: ChatMessage[] = [];

  ngOnInit() {
    this.twitchService.chatMessages$.subscribe((message) => {
      this.messages.push(message);
    });
  }
}
