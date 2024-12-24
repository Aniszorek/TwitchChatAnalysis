import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';
import {NgForOf, NgIf} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';
import {BackendService} from '../../../../shared/services/backend.service';
import {TwitchService} from '../../../twitch/twitch.service';
import {PostPollRequest} from '../../../../shared/services/models/poll-request';

@Component({
  selector: 'app-raid-poll',
  imports: [
    FormsModule,
    MatIcon,
    NgForOf,
    NgIf,
    MatTooltip,
  ],
  templateUrl: './raid-poll.component.html',
  standalone: true,
  styleUrls: ['./raid-poll.component.css'],
})
export class RaidPollComponent implements OnInit {
  private readonly raidTimerMaxTime: number = 90;
  private raidTimerInterval: any;
  broadcasterUserId: string = '';
  pollOptions: PostPollRequest = {
    broadcaster_id: '',
    channel_points_voting_enabled: false,
    choices: [],
    duration: 60,
    title: ''
  }
  maxOptions = 4;
  newOption: string = '';
  twitchUsername: string = '';
  raidTimerVisible: boolean = false;
  raidTimer: number = this.raidTimerMaxTime;

  constructor(private readonly twitchService: TwitchService,
              private readonly backendService: BackendService) {
  }

  ngOnInit() {
    this.broadcasterUserId = this.twitchService['state'].broadcasterId.getValue()!;
    this.pollOptions.broadcaster_id = this.broadcasterUserId
  }

  addOption() {
    if (this.pollOptions.choices.length < this.maxOptions && this.newOption.trim() !== '') {
      this.pollOptions.choices.push({title: this.newOption.trim()});
      this.newOption = '';
    }
  }

  removeOption(index: number) {
    this.pollOptions.choices.splice(index, 1);
  }

  applyChanges() {
    this.backendService.postPoll(this.pollOptions).subscribe((data) => {
      console.log(data);
    })
  }

  onStartRaid() {
    this.backendService.startRaid(this.broadcasterUserId, this.twitchUsername).subscribe((data) => {
      console.log(data);
      if (data) {
        this.startRaidTimer();
      }
    });
  }

  startRaidTimer() {
    this.clearRaidTimer();

    this.raidTimerVisible = true;
    this.raidTimer = this.raidTimerMaxTime;

    this.raidTimerInterval = setInterval(() => {
      if (this.raidTimer > 0) {
        this.raidTimer--;
      } else {
        this.clearRaidTimer();
      }
    }, 1000);
  }

  onCancelRaid() {
    this.backendService.cancelRaid(this.broadcasterUserId).subscribe((data) => {
      console.log(data);
      this.clearRaidTimer();
    });
  }

  clearRaidTimer() {
    if (this.raidTimerInterval) {
      clearInterval(this.raidTimerInterval);
      this.raidTimerInterval = null;
    }
    this.raidTimerVisible = false;
    this.raidTimer = this.raidTimerMaxTime;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
}
