import {Component, inject, Input, input, InputSignal, OnInit, output} from '@angular/core';
import {DatePipe, NgIf, NgStyle} from '@angular/common';
import {Message, NlpChatMessage} from '../../../twitch/message';
import {BanData} from '../../../../shared/services/backend.service';
import {ModActionButtonsComponent} from './mod-action-buttons/mod-action-buttons.component';
import {Tab} from '../../../twitch/permissions.config';
import {TwitchService} from '../../../twitch/twitch.service';

@Component({
  selector: 'app-chat-message',
  imports: [
    DatePipe,
    ModActionButtonsComponent,
    NgIf,
    NgStyle,

  ],
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css'],
  standalone: true,
})
export class ChatMessageComponent {
  messageData: InputSignal<Message | NlpChatMessage> = input.required<Message | NlpChatMessage>({alias: 'message'});
  showButtonsPossible: InputSignal<boolean> = input.required<boolean>({alias: 'showButtons'})
  removed = output<string>();
  addVip = output<string>();
  addMod = output<string>();
  ban = output<BanData>();
  popoutActive = output<boolean>();
  twitchService = inject(TwitchService);

  showButtons = false;
  popoutsOpen = false;

  protected removeMessage(): void {
    this.removed.emit(this.messageData().messageId);
  }

  protected onBanUser({minutes, reason}: { minutes: number, reason: string }): void {
    this.ban.emit({
      user_id: this.messageData().chatterUserId,
      duration: minutes > 0 ? minutes : null,
      reason: reason
    });
  }

  protected onVip(): void {
    this.addVip.emit(this.messageData().chatterUserId);
  }

  protected onMod(): void {
    this.addMod.emit(this.messageData().chatterUserId);
  }

  popoutOpenHandler(open: boolean) {
    this.popoutsOpen = open;
    this.popoutActive.emit(open)
  }

  protected readonly Tab = Tab;
}
