import {
  AfterViewChecked,
  Component, DoCheck,
  ElementRef,
  input,
  InputSignal,
  IterableDiffers,
  output,
  ViewChild
} from '@angular/core';
import {NgClass, NgForOf} from '@angular/common';
import {NlpChatMessage, SentimentLabel} from '../../twitch/message';
import {ChatMessageComponent} from '../chat/chat-message/chat-message.component';
import {BanData} from '../../../shared/services/backend.service';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-suspicious-messages',
  imports: [
    NgForOf,
    NgClass,
    ChatMessageComponent,
    MatIcon
  ],
  templateUrl: './suspicious-messages.component.html',
  standalone: true,
  styleUrl: './suspicious-messages.component.css'
})
export class SuspiciousMessagesComponent implements AfterViewChecked, DoCheck{
  suspiciousMessages: InputSignal<NlpChatMessage[]> = input.required<NlpChatMessage[]>()
  removed = output<string>()
  addVip = output<string>()
  addMod = output<string>()
  ban = output<BanData>()
  popoutOpen: boolean = false;
  @ViewChild('chatList') chatList!: ElementRef<HTMLUListElement>;

  private iterableDiffer: any;
  private isScrollToBottomRequested = false;


  constructor(private iterableDiffers: IterableDiffers) {
    this.iterableDiffer = this.iterableDiffers.find([]).create();
  }

  ngDoCheck() {
    const changes = this.iterableDiffer.diff(this.suspiciousMessages());

    if (changes) {
      this.isScrollToBottomRequested = true;
    }
  }

  ngAfterViewChecked() {
    if (this.isScrollToBottomRequested) {
      this.scrollToBottom();
      this.isScrollToBottomRequested = false;
    }
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

  onDeleteMessage(id: string) {
    this.removed.emit(id);
  }

  onAddVip(userId: string) {
    this.addVip.emit(userId);
  }

  onAddMod(userId: string) {
    this.addMod.emit(userId);
  }

  onBan({user_id, duration, reason}: BanData) {
    this.ban.emit({user_id, duration, reason});
  }

  popoutActiveHandler(open: boolean) {
    // console.log(open)
    this.popoutOpen = open
  }
}
