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
import {BackendService} from '../../../shared/services/backend.service';

@Component({
  selector: 'app-stream-chat',
  standalone: true,
  imports: [NgForOf, DatePipe],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  broadcasterUsername: string | null = null;
  broadcasterId: string | null = null;
  userId: string | null = null;

  private readonly twitchService = inject(TwitchService);
  private readonly backendService = inject(BackendService);
  private readonly destroyRef = inject(DestroyRef);
  private messageInputValue: string = ""

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

    this.broadcasterUsername = this.twitchService['state'].broadcasterUsername.getValue();
    this.broadcasterId = this.twitchService['state'].broadcasterId.getValue();
    this.userId = this.twitchService['state'].userId.getValue();
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

    this.messageInputValue = value;
  }

  onSendMessage(){

    const message = this.chatInput.nativeElement.value
    if(message.length < 1) {
      return
    }
    console.log('🚀   Sending message   🚀');
    this.backendService.sendTwitchMessage(this.broadcasterId!, this.userId!, message).subscribe(() => {})
    this.messageInputValue = ""
    this.chatInput.nativeElement.value = ""
  }

  private getTotalPadding(inputElement: Element) {
    const computedStyles = window.getComputedStyle(inputElement);
    const paddingTop = parseFloat(computedStyles.paddingTop);
    const paddingBottom = parseFloat(computedStyles.paddingBottom);

    return paddingTop + paddingBottom;
  }
}
