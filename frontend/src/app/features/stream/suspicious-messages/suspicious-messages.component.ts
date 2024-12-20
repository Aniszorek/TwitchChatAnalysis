import {AfterViewChecked, Component, DestroyRef, ElementRef, inject, OnInit, ViewChild} from '@angular/core';
import {TwitchService} from '../../twitch/twitch.service';
import {NgClass, NgForOf} from '@angular/common';
import {negativeClasses, NlpChatMessage, SentimentLabel} from '../../twitch/message';

@Component({
  selector: 'app-suspicious-messages',
  imports: [
    NgForOf,
    NgClass
  ],
  templateUrl: './suspicious-messages.component.html',
  standalone: true,
  styleUrl: './suspicious-messages.component.css'
})
export class SuspiciousMessagesComponent implements OnInit, AfterViewChecked {
  private readonly twitchService = inject(TwitchService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('chatList') chatList!: ElementRef<HTMLUListElement>;

  messages: NlpChatMessage[] = [];

  ngOnInit() {
    const sub = this.twitchService.nlpChatMessages$.subscribe((message) => {
      if (message) {
        console.log(message)
        if (negativeClasses.includes(message.nlpClassification)) {
          this.messages.push(message);
        }
      } else {
        this.messages = [];
      }
    });


    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  getMessageClass(sentiment: SentimentLabel): string {
    switch (sentiment) {
      case SentimentLabel.VERY_NEGATIVE:
        return 'very-negative';
      case SentimentLabel.NEGATIVE:
        return 'negative';
      case SentimentLabel.SLIGHTLY_NEGATIVE:
        return 'slightly-negative';
      default:
        return 'neutral';
    }
  }

  private scrollToBottom(): void {
    if (this.chatList) {
      this.chatList.nativeElement.scrollTop = this.chatList.nativeElement.scrollHeight;
    }
  }
}
