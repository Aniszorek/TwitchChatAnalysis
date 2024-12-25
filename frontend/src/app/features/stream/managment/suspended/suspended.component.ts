import {Component, OnInit} from '@angular/core';
import {BackendService, BanData} from '../../../../shared/services/backend.service';
import {TwitchService} from '../../../twitch/twitch.service';
import {NgForOf,} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';
import {SuspendedUsers, User} from './models/suspended.model';
import {MatIcon} from '@angular/material/icon';
import {Subscription} from 'rxjs';

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
  private subscriptions: Subscription = new Subscription();
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
    this.addSubscriptions();
  }

  loadSuspendedUsers(broadcasterId: string): void {
    this.streamService.getSuspendedUsers(broadcasterId).subscribe((data) => {
      this.suspendedUsers = data;
    });
  }

  onRemoveTimeout(user: User) {
    this.streamService.unbanUser(this.broadcasterId!, this.moderatorId!, user.user_id).subscribe(() => {
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
    this.streamService.banUser(this.broadcasterId!, this.moderatorId!, user.user_id, data).subscribe(() => {
      this.suspendedUsers.banned_users.push(user);
      this.suspendedUsers.timed_out_users = this.suspendedUsers.timed_out_users.filter(u => u.user_id !== user.user_id);
    });
  }

  onUnbanUser(user: User) {
    this.streamService.unbanUser(this.broadcasterId!, this.moderatorId!, user.user_id).subscribe(() => {
      this.suspendedUsers.banned_users = this.suspendedUsers.banned_users.filter(u => u.user_id !== user.user_id);
    });
  }

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (searchTerm.length > 0) {
      this.searchedUsers.banned_users = this.suspendedUsers.banned_users.filter(user =>
        user.user_login.toLowerCase().includes(searchTerm)
      );

      this.searchedUsers.timed_out_users = this.suspendedUsers.timed_out_users.filter(user =>
        user.user_login.toLowerCase().includes(searchTerm)
      );
    }
    else {
      this.searchedUsers.banned_users = [];
      this.searchedUsers.timed_out_users = [];
    }
  }

  private addSubscriptions() {
    this.subscriptions.add(
      this.twitchService.bannedChanges$.subscribe((change) => {
        console.log(change);
        if (change.action === 'add' && change.user) {
          this.addSuspendedUser(change.user);
        } else if (change.action === 'remove' && change.user) {
          this.removeSuspendedUser(change.user);
        }
      }),
    );
  }

  private addSuspendedUser(user: User) {
    if (!user.expires_at){
      if (!this.suspendedUsers.banned_users.some((m) => m.user_id === user.user_id)) {
        this.suspendedUsers.banned_users.push(user);
      }
    }
    else {
      if (!this.suspendedUsers.timed_out_users.some((m) => m.user_id === user.user_id)) {
        this.suspendedUsers.timed_out_users.push(user);
      }
    }
  }

  private removeSuspendedUser(user: User) {
    this.suspendedUsers.banned_users = this.suspendedUsers.banned_users.filter((m) => m.user_id !== user.user_id);
    this.suspendedUsers.timed_out_users= this.suspendedUsers.timed_out_users.filter((m) => m.user_id !== user.user_id);
  }
}
