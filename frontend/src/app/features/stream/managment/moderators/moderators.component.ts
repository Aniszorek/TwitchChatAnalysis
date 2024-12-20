import {Component, OnInit} from '@angular/core';
import {BackendService} from '../../../../shared/services/backend.service';
import {TwitchService} from '../../../twitch/twitch.service';
import {NgForOf,} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';
import {User} from '../suspended/models/suspended.model';

@Component({
  selector: 'app-moderators',
  imports: [
    NgForOf,
    MatTooltip,
    MatIcon
  ],
  templateUrl: './moderators.component.html',
  standalone: true,
  styleUrl: './moderators.component.css'
})
export class ModeratorsComponent implements OnInit {
  broadcasterUsername: string | null = null;
  broadcasterId: string | null = null;
  moderatorId: string | null = null;
  searchedModerators: User[] =  [];
  searchedVips: User[] =  [];
  moderators: User[] = [];
  vips: User[] = [];

  constructor(private readonly streamService: BackendService,
              private readonly twitchService: TwitchService) {
  }

  ngOnInit(): void {
    this.broadcasterUsername = this.twitchService['state'].broadcasterUsername.getValue();
    this.broadcasterId = this.twitchService['state'].broadcasterId.getValue();
    this.moderatorId = this.twitchService['state'].userId.getValue();
    this.loadModerators(this.broadcasterId!);
    this.loadVips(this.broadcasterId!);
  }

  loadModerators(broadcasterId: string): void {
    this.streamService.getModerators(broadcasterId).subscribe((data) => {
      this.moderators = data;
    });
  }

  loadVips(broadcasterId: string): void {
    this.streamService.getVips(broadcasterId).subscribe((data) => {
      this.vips = data;
    });
  }

  onRemoveModerator(user: User) {
    this.streamService.removeModerator(this.broadcasterId!, user.user_id).subscribe(() => {
      this.moderators = this.moderators.filter(u => u.user_id !== user.user_id);
    });
  }

  onRemoveVip(user: User) {
    this.streamService.removeVip(this.broadcasterId!, user.user_id).subscribe(() => {
      this.vips = this.vips.filter(u => u.user_id !== user.user_id);
    });
  }

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    this.searchedModerators = this.moderators.filter(user =>
      user.user_login.toLowerCase().includes(searchTerm)
    );

    this.searchedVips = this.vips.filter(user =>
      user.user_login.toLowerCase().includes(searchTerm)
    );
  }
}
