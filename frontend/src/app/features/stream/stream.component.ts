import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {ChatComponent} from "./chat/chat.component";
import {VideoComponent} from './video/video.component';
import {TwitchService} from '../twitch/twitch.service';
import {SuspiciousMessagesComponent} from './suspicious-messages/suspicious-messages.component';
import {RouterOutlet} from '@angular/router';
import {Message, negativeClasses, NlpChatMessage, SentimentLabel} from '../twitch/message';
import {BackendService, BanData} from '../../shared/services/backend.service';
import {Tab} from '../twitch/permissions.config';
import {NgIf} from '@angular/common';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [
    ChatComponent,
    VideoComponent,
    SuspiciousMessagesComponent,
    RouterOutlet,
    NgIf
  ],
  templateUrl: './stream.component.html',
  styleUrl: './stream.component.css'
})
export class StreamComponent implements OnInit {
  twitchService = inject(TwitchService)
  destroyRef = inject(DestroyRef)
  streamService = inject(BackendService)
  selectedUser: string | null = null;
  messages: Message[] = []
  nlpMessages: NlpChatMessage[] = [];
  broadcasterId: string | null = null;
  moderatorId: string | null = null;
  chatters: Map<string, string> = new Map<string, string>();


  async ngOnInit() {
    const subMessages = this.twitchService.chatMessages$.subscribe(async (message) => {
      if (message) {
        let color = ''
        if (!this.isChatterExists(message.chatterUserId)) {
          try {
            const response = await firstValueFrom(this.streamService.getTwitchUserChatColor(message.chatterUserId));
            this.addOrUpdateChatter(message.chatterUserId, response.data[0].color);
            color = response.data[0].color
            console.log(this.chatters)
          } catch (error) {
            this.addOrUpdateChatter(message.chatterUserId, '');
          }
          message.color = color
        } else {
          message.color = this.getChatterColor(message.chatterUserId)
        }

        this.messages.push(message);
      } else {
        this.messages = [];
      }
    });

    const subNlp = this.twitchService.nlpChatMessages$.subscribe((message) => {
      if (message) {
        if (negativeClasses.includes(message.nlpClassification)) {
          message.color = this.getChatterColor(message.chatterUserId);
          this.nlpMessages.push(message);
        }
      } else {
        this.nlpMessages = [];
      }
    });

    const subDeleted = this.twitchService.removedMessage$.subscribe((messageId) => {
      this.removeMessageFromEventSub(messageId)
    })

    this.broadcasterId = this.twitchService['state'].broadcasterId.getValue();
    this.moderatorId = this.twitchService['state'].userId.getValue();

    this.destroyRef.onDestroy(() => subMessages.unsubscribe());
    this.destroyRef.onDestroy(() => subNlp.unsubscribe());
    this.destroyRef.onDestroy(() => subDeleted.unsubscribe());
  }

  constructor(twitchService: TwitchService) {
    this.selectedUser = twitchService['state'].broadcasterUsername.getValue();
  }

  removeMessageFromEventSub(messageId: string) {
    this.messages = this.messages.filter(message => message.messageId != messageId)
    this.nlpMessages = this.nlpMessages.filter(message => message.messageId != messageId)
  }

  removeMessage(messageId: string) {
    this.streamService.deleteMessage(this.broadcasterId!, this.moderatorId!, messageId).subscribe(() => {
      this.messages = this.messages.filter(message => message.messageId != messageId)
      this.nlpMessages = this.nlpMessages.filter(message => message.messageId != messageId)
    });
  }

  addVip(userId: string) {
    this.streamService.giveVip(this.broadcasterId!, userId).subscribe()
  }

  addMod(userId: string) {
    this.streamService.giveModerator(this.broadcasterId!, userId).subscribe()
  }

  banUser({user_id, duration, reason}: BanData) {
    this.streamService.banUser(this.broadcasterId!, this.moderatorId!, user_id!, {
      user_id,
      duration,
      reason
    }).subscribe();
  }

  isChatterExists(username: string): boolean {
    return this.chatters.has(username);
  }

  addOrUpdateChatter(username: string, color: string): void {
    const updatedMap = new Map(this.chatters);
    updatedMap.set(username, color);
    this.chatters = updatedMap;

  }

  getChatterColor(username: string): string | undefined {
    return this.chatters.get(username);
  }


  protected readonly Tab = Tab;
}
