import {
  AfterViewChecked,
  Component, DestroyRef,
  DoCheck,
  ElementRef, inject,
  input,
  InputSignal,
  IterableDiffers, OnInit,
  output,
  ViewChild
} from '@angular/core';
import {NgForOf} from '@angular/common';
import {Message} from '../../twitch/message';
import {BackendService} from '../../../shared/services/backend.service';
import {ChatMessageComponent} from './chat-message/chat-message.component';
import {BanData} from '../../../shared/services/backend.service';
import {TwitchService} from '../../twitch/twitch.service';

@Component({
  selector: 'app-stream-chat',
  standalone: true,
  imports: [NgForOf, ChatMessageComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements DoCheck, OnInit, AfterViewChecked {
  messages: InputSignal<Message[]> = input.required<Message[]>()
  removed = output<string>()
  addVip = output<string>()
  addMod = output<string>()
  ban = output<BanData>()

  broadcasterUsername: string | null = null;
  broadcasterId: string | null = null;
  userId: string | null = null;
  popoutOpen: boolean = false;
  private messageInputValue: string = ""

  private iterableDiffer: any;
  private isScrollToBottomRequested = false;

  private readonly twitchService = inject(TwitchService);
  private readonly backendService = inject(BackendService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('chatList') chatList!: ElementRef<HTMLUListElement>;
  @ViewChild('chatInput') chatInput!: ElementRef<HTMLTextAreaElement>;

  readonly maxChars = 260;
  readonly maxInputHeight = 70;

  ngOnInit() {
    this.broadcasterUsername = this.twitchService['state'].broadcasterUsername.getValue();
    this.broadcasterId = this.twitchService['state'].broadcasterId.getValue();
    this.userId = this.twitchService['state'].userId.getValue();
  }

  constructor(private iterableDiffers: IterableDiffers) {
    this.iterableDiffer = this.iterableDiffers.find([]).create();
  }

  ngDoCheck() {
    const changes = this.iterableDiffer.diff(this.messages());

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
