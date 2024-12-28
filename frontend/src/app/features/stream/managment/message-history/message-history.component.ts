import {Component, OnInit} from '@angular/core';
import {GetChatterInfoResponse} from '../../../../shared/services/models/chatter-info-response';
import {TwitchService} from '../../../twitch/twitch.service';
import {BackendService, BanData} from '../../../../shared/services/backend.service';
import {FormsModule} from '@angular/forms';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {SentimentLabel} from '../../../twitch/message';
import {NlpMessage} from './models/nlp-message';
import {firstValueFrom} from 'rxjs';
import {MatTooltip} from '@angular/material/tooltip';
import {ModActionButtonsComponent} from '../../chat/chat-message/mod-action-buttons/mod-action-buttons.component';
import {MessageCounters} from './models/messageCounters';
import {ActiveFilters} from './models/activeFilters';

@Component({
  selector: 'app-message-history',
  imports: [
    FormsModule,
    NgIf,
    NgForOf,
    NgClass,
    MatTooltip,
    ModActionButtonsComponent
  ],
  templateUrl: './message-history.component.html',
  standalone: true,
  styleUrl: './message-history.component.css'
})
export class MessageHistoryComponent implements OnInit {
  broadcasterUserId: string = '';
  broadcasterUserLogin: string = ''
  moderatorUserId: string | null = '';
  user: GetChatterInfoResponse = {
    chatter_user_id: "",
    chatter_user_login: "",
    is_banned: false,
    is_mod: false,
    is_timeouted: false,
    is_vip: false,
  };
  searchQuery: string = '';
  lastSearchedQuery: string = '';
  isSearchDisabled: boolean = true;
  isSearchInputDisabled: boolean = false;
  messages: NlpMessage[] = [];
  messageCounters: MessageCounters = {
    [SentimentLabel.VERY_NEGATIVE]: 0,
    [SentimentLabel.NEGATIVE]: 0,
    [SentimentLabel.SLIGHTLY_NEGATIVE]: 0,
    [SentimentLabel.VERY_POSITIVE]: 0,
    [SentimentLabel.POSITIVE]: 0,
    [SentimentLabel.SLIGHTLY_POSITIVE]: 0,
    [SentimentLabel.NEUTRAL]: 0
  };
  filteredMessages: NlpMessage[] = [];
  activeFilters: ActiveFilters = {
    [SentimentLabel.VERY_NEGATIVE]: true,
    [SentimentLabel.NEGATIVE]: false,
    [SentimentLabel.SLIGHTLY_NEGATIVE]: false,
    [SentimentLabel.VERY_POSITIVE]: false,
    [SentimentLabel.POSITIVE]: false,
    [SentimentLabel.SLIGHTLY_POSITIVE]: false,
    [SentimentLabel.NEUTRAL]: false
  }


  constructor(private readonly twitchService: TwitchService,
              private readonly backendService: BackendService) {
    this.resetFiltersAndCounters()
  }

  ngOnInit() {
    this.broadcasterUserId = this.twitchService['state'].broadcasterId.getValue()!;
    this.broadcasterUserLogin = this.twitchService['state'].broadcasterUsername.getValue()!;
    this.moderatorUserId = this.twitchService['state'].userId.getValue();
  }

  onInputChange() {
    this.isSearchDisabled = !this.searchQuery || this.searchQuery === this.lastSearchedQuery;
  }

  getMessageClass(sentiment: SentimentLabel): string {
    switch (sentiment) {
      case SentimentLabel.VERY_NEGATIVE:
        return 'very-negative';
      case SentimentLabel.NEGATIVE:
        return 'negative';
      case SentimentLabel.SLIGHTLY_NEGATIVE:
        return 'slightly-negative';
      case SentimentLabel.POSITIVE:
        return 'positive';
      case SentimentLabel.VERY_POSITIVE:
        return 'very-positive'
      case SentimentLabel.SLIGHTLY_POSITIVE:
        return 'slightly-positive'
      default:
        return 'neutral';
    }
  }


  async onSearchUser() {
    if (!this.searchQuery || this.searchQuery === this.lastSearchedQuery) {
      return;
    }
    const username = this.searchQuery.toLowerCase();

    this.lastSearchedQuery = username;
    this.isSearchDisabled = true;
    this.isSearchInputDisabled = true;

    try {
      const userData = await firstValueFrom(
        this.backendService.getUserInformation(this.broadcasterUserId, username)
      );
      this.user = userData!;

      if (userData) {
        await this.loadMessages(username);
      }
    } catch (error) {
      this.isSearchInputDisabled = false;
      console.error('Error loading user data', error);
    }
  }

  private async loadMessages(username: string) {

    this.resetFiltersAndCounters()
    this.messages = []

    const messageData = await firstValueFrom(
        this.backendService.getTwitchMessages(this.broadcasterUserLogin, username)
      );
      if (!messageData.messages) {
        this.messages = []
      }
      else {
        this.messages = messageData.messages;
      }
    this.applyMessageFilters(undefined)
    this.setMessageClasses();

      this.isSearchInputDisabled = false;
  }

  private setMessageClasses() {

    this.messages.forEach((message) => {
      this.messageCounters[message.nlp_classification] += 1
    })
  }

  applyMessageFilters(filter: SentimentLabel | undefined) {
    if(filter)
      this.activeFilters[filter] = !this.activeFilters[filter]

    this.filteredMessages = this.messages.filter((message) => {
      return this.activeFilters[message.nlp_classification]
    })

  }

  private resetFiltersAndCounters() {
    this.messageCounters = {
      [SentimentLabel.VERY_NEGATIVE]: 0,
      [SentimentLabel.NEGATIVE]: 0,
      [SentimentLabel.SLIGHTLY_NEGATIVE]: 0,
      [SentimentLabel.VERY_POSITIVE]: 0,
      [SentimentLabel.POSITIVE]: 0,
      [SentimentLabel.SLIGHTLY_POSITIVE]: 0,
      [SentimentLabel.NEUTRAL]: 0
    };

    this.activeFilters = {
      [SentimentLabel.VERY_NEGATIVE]: true,
      [SentimentLabel.NEGATIVE]: false,
      [SentimentLabel.SLIGHTLY_NEGATIVE]: false,
      [SentimentLabel.VERY_POSITIVE]: false,
      [SentimentLabel.POSITIVE]: false,
      [SentimentLabel.SLIGHTLY_POSITIVE]: false,
      [SentimentLabel.NEUTRAL]: false
    }
  }
  protected readonly SentimentLabel = SentimentLabel;

  addVip() {
    this.backendService.giveVip(this.broadcasterUserId!, this.user.chatter_user_id).subscribe()
  }

  addMod() {
    this.backendService.giveModerator(this.broadcasterUserId!, this.user.chatter_user_id).subscribe()
  }

  banUser({minutes, reason}: {minutes: number, reason: string}) {
    this.backendService.banUser(this.broadcasterUserId!, this.moderatorUserId!, this.user.chatter_user_id!, {user_id: this.user.chatter_user_id, duration: minutes, reason}).subscribe();
  }
}

