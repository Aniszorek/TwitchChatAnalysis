import {Component, OnInit} from '@angular/core';
import {BackendService, BanData} from '../../../../shared/backend.service';
import {TwitchService} from '../../../twitch/twitch.service';
import {NgForOf,} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';
import {SuspendedUsers, User} from './models/suspended.model';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-suspended',
  imports: [
    NgForOf,
    MatTooltip,
    MatIcon
  ],
  templateUrl: './suspended.component.html',
  standalone: true,
  styleUrl: './suspended.component.css'
})
export class SuspendedComponent implements OnInit {
  broadcasterUsername: string | null = null;
  broadcasterId: string | null = null;
  moderatorId: string | null = null;
  searchedUsers: SuspendedUsers =  {
    banned_users: [],
    timed_out_users: []
  }
  suspendedUsers: SuspendedUsers =  {
    banned_users: [],
    timed_out_users: []
  }

  constructor(private readonly streamService: BackendService,
              private readonly twitchService: TwitchService) {
  }

  ngOnInit(): void {
    this.broadcasterUsername = this.twitchService['state'].broadcasterUsername.getValue();
    this.broadcasterId = this.twitchService['state'].broadcasterId.getValue();
    this.moderatorId = this.twitchService['state'].userId.getValue();
    this.loadSuspendedUsers(this.broadcasterId!);
  }

  loadSuspendedUsers(broadcasterId: string): void {
    this.streamService.getSuspendedUsers(broadcasterId).subscribe((data) => {
      this.suspendedUsers = data;
    });
  }

  onRemoveTimeout(user: User) {
    this.streamService.unbanUser(this.broadcasterId!, this.moderatorId!, user.user_id).subscribe((data) => {
      this.suspendedUsers.timed_out_users = this.suspendedUsers.timed_out_users.filter(u => u.user_id !== user.user_id);
    });
  }

  onBanUser(user: User) {
    const data: BanData = {
      user_id: user.user_id,
      duration: null,
      // todo dorobić możliwość podania powodu może
      reason: "",
    }
    this.streamService.banUser(this.broadcasterId!, this.moderatorId!, user.user_id, data).subscribe((data) => {
      this.suspendedUsers.banned_users.push(user);
      this.suspendedUsers.timed_out_users = this.suspendedUsers.timed_out_users.filter(u => u.user_id !== user.user_id);
    });
  }

  onUnbanUser(user: User) {
    this.streamService.unbanUser(this.broadcasterId!, this.moderatorId!, user.user_id).subscribe((data) => {
      this.suspendedUsers.banned_users = this.suspendedUsers.banned_users.filter(u => u.user_id !== user.user_id);
    });
  }

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    console.log(searchTerm)

    this.searchedUsers.banned_users = this.suspendedUsers.banned_users.filter(user =>
      user.user_login.toLowerCase().includes(searchTerm)
    );
  }
}
