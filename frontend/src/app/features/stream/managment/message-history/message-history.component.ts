import {Component, OnInit} from '@angular/core';
import {GetChatterInfoResponse} from '../../../../shared/services/models/chatter-info-response';
import {TwitchService} from '../../../twitch/twitch.service';
import {BackendService} from '../../../../shared/services/backend.service';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {SentimentLabel} from '../../../twitch/message';
import {NlpMessage} from './models/nlp-message';
import {firstValueFrom} from 'rxjs';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'app-message-history',
  imports: [
    FormsModule,
    NgIf,
    NgForOf,
    DatePipe,
    NgClass,
    MatIcon,
    MatTooltip
  ],
  templateUrl: './message-history.component.html',
  standalone: true,
  styleUrl: './message-history.component.css'
})
export class MessageHistoryComponent implements OnInit {
  broadcasterUserId: string = '';
  broadcasterUserLogin: string = '';
  user: GetChatterInfoResponse = {
    chatter_user_id: "",
    chatter_user_login: "",
    is_banned: false,
    is_mod: false,
    is_timeouted: false,
    is_vip: false
  };
  searchQuery: string = '';
  lastSearchedQuery: string = '';
  isSearchDisabled: boolean = true;
  isSearchInputDisabled: boolean = false;
  messages: NlpMessage[] = [];

  constructor(private readonly twitchService: TwitchService,
              private readonly backendService: BackendService) {
  }

  ngOnInit() {
    this.broadcasterUserId = this.twitchService['state'].broadcasterId.getValue()!;
    this.broadcasterUserLogin = this.twitchService['state'].broadcasterUsername.getValue()!;
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
        return 'veru-positive'
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

    this.lastSearchedQuery = this.searchQuery;
    this.isSearchDisabled = true;
    this.isSearchInputDisabled = true;

    try {
      const userData = await firstValueFrom(
        this.backendService.getUserInformation(this.broadcasterUserId, this.searchQuery)
      );
      this.user = userData!;

      if (userData) {
        await this.loadMessages();
      }
    } catch (error) {
      console.error('Error loading user data', error);
    }
  }

  private async loadMessages() {
      const messageData = await firstValueFrom(
        this.backendService.getTwitchMessages(this.broadcasterUserLogin, this.searchQuery)
      );
      if (!messageData.messages) {
        this.messages = []
      }
      else {
        this.messages = messageData.messages;
      }

      this.isSearchInputDisabled = false;
  }
}

