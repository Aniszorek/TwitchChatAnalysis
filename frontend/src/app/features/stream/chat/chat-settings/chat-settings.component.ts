import {Component, ElementRef, HostListener, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {TwitchService} from '../../../twitch/twitch.service';
import {BackendService, ChatSettings} from '../../../../shared/services/backend.service';

@Component({
  selector: 'app-chat-settings',
  imports: [
    FormsModule,
    NgIf,
    NgForOf,
    MatIcon,
  ],
  templateUrl: './chat-settings.component.html',
  standalone: true,
  styleUrl: './chat-settings.component.css'
})
export class ChatSettingsComponent implements OnInit {
  settingsVisible = false;
  broadcasterUserId = '';
  userId = '';

  settings: ChatSettings = {
    emote_mode: false,
    follower_mode: false,
    follower_mode_duration: null,
    non_moderator_chat_delay: false,
    non_moderator_chat_delay_duration: null,
    slow_mode: false,
    slow_mode_wait_time: null,
    subscriber_mode: false,
    unique_chat_mode: false
  }
  delayOptions = [2, 4, 6];

  constructor(private readonly twitchService: TwitchService,
              private readonly backendService: BackendService,
              private el: ElementRef) {
  }

  toggleSettings() {
    this.settingsVisible = !this.settingsVisible;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedInside = this.el.nativeElement.contains(event.target);
    if (!clickedInside && this.settingsVisible) {
      this.settingsVisible = false;
    }
  }

  ngOnInit(): void {
    this.broadcasterUserId = this.twitchService['state'].broadcasterId.getValue()!;
    this.userId = this.twitchService['state'].userId.getValue()!;
    this.backendService.getChatSettings(this.broadcasterUserId, this.userId).subscribe((data) => {
      this.settings = this.mapRawData(data.data[0]);
    });
  }

  updateFollowerMode(value: boolean): void {
    this.settings.follower_mode = value;
    this.settings.follower_mode_duration = 0;
    this.saveSettings();
  }

  updateNonModeratorChatDelay(value: boolean): void {
    this.settings.non_moderator_chat_delay_duration = this.delayOptions[0];
    this.settings.non_moderator_chat_delay = value;
    this.saveSettings();
  }

  updateSlowMode(value: boolean): void {
    this.settings.slow_mode_wait_time = 30;
    this.settings.slow_mode = value;
    this.saveSettings();
  }

  updateSubscriberMode(value: boolean): void {
    this.settings.subscriber_mode = value;
    this.saveSettings();
  }

  updateUniqueChatMode(value: boolean): void {
    this.settings.unique_chat_mode = value;
    this.saveSettings();
  }

  updateFollowerDuration(event: number) {
    const minDuration = 0;
    const maxDuration = 129600;

    this.settings.follower_mode_duration = Math.max(minDuration, Math.min(event, maxDuration));
  }

  onDelayChange(event: number){
    this.settings.non_moderator_chat_delay_duration = Number(event);
    this.saveSettings();
  }

  updateSlowTimeDuration(event: number){
    const minDuration = 3;
    const maxDuration = 120;

    this.settings.slow_mode_wait_time = Math.max(minDuration, Math.min(event, maxDuration));
  }

  protected saveSettings(): void {
    this.backendService.patchChatSettings(this.broadcasterUserId, this.userId, this.settings)
      .subscribe();
  }

  private mapRawData(data: any): ChatSettings {
    return {
      emote_mode: data.emote_mode,
      follower_mode: data.follower_mode,
      follower_mode_duration: data.follower_mode_duration,
      non_moderator_chat_delay: data.non_moderator_chat_delay,
      non_moderator_chat_delay_duration: data.non_moderator_chat_delay_duration,
      slow_mode: data.slow_mode,
      slow_mode_wait_time: data.slow_mode_wait_time,
      subscriber_mode: data.subscriber_mode,
      unique_chat_mode: data.unique_chat_mode
    };
  }
}

