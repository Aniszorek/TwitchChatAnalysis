import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import {DatePipe, NgForOf} from '@angular/common';
import {TwitchService} from '../../twitch/twitch.service';
import {Message} from '../../twitch/message';

@Component({
  selector: 'app-stream-chat',
  standalone: true,
  imports: [NgForOf, DatePipe],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  private readonly twitchService = inject(TwitchService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('chatList') chatList!: ElementRef<HTMLUListElement>;
  @ViewChild('chatInput') chatInput!: ElementRef<HTMLTextAreaElement>;

  messages: Message[] = [];
  readonly maxChars = 260;
  readonly maxInputHeight = 70;

  ngOnInit() {
    const sub = this.twitchService.chatMessages$.subscribe((message) => {
      if (message) {
        this.messages.push(message);
      } else {
        this.messages = [];
      }
    });

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.chatList) {
      this.chatList.nativeElement.scrollTop = this.chatList.nativeElement.scrollHeight;
    }
  }

  onInput(event: Event): void {
    const inputElement = this.chatInput.nativeElement;
    const value = inputElement.value;

    inputElement.style.height = 'auto';

    const totalPadding = this.getTotalPadding(inputElement);
    const adjustedHeight = Math.min(inputElement.scrollHeight - totalPadding, this.maxInputHeight);
    inputElement.style.height = `${adjustedHeight}px`;

    if (value.length > this.maxChars) {
      inputElement.value = value.substring(0, this.maxChars);
    }
  }

  private getTotalPadding(inputElement: Element) {
    const computedStyles = window.getComputedStyle(inputElement);
    const paddingTop = parseFloat(computedStyles.paddingTop);
    const paddingBottom = parseFloat(computedStyles.paddingBottom);

    return paddingTop + paddingBottom;
  }

}
