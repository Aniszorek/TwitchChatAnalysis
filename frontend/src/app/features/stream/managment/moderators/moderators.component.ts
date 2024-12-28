import {Component, OnDestroy, OnInit} from '@angular/core';
import {BackendService} from '../../../../shared/services/backend.service';
import {TwitchService} from '../../../twitch/twitch.service';
import {NgForOf,} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';
import {User} from '../suspended/models/suspended.model';
import {Subscription} from 'rxjs';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-moderators',
  imports: [
    NgForOf,
    MatTooltip,
    MatIcon,
    FormsModule
  ],
  templateUrl: './moderators.component.html',
  standalone: true,
  styleUrl: './moderators.component.css'
})
export class ModeratorsComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  broadcasterUsername: string | null = null;
  broadcasterId: string | null = null;
  moderatorId: string | null = null;
  searchedModerators: User[] =  [];
  searchedVips: User[] =  [];
  moderators: User[] = [];
  vips: User[] = [];
  searchQuery: string = "";

  constructor(private readonly streamService: BackendService,
              private readonly twitchService: TwitchService) {
  }

  ngOnInit(): void {
    this.broadcasterUsername = this.twitchService['state'].broadcasterUsername.getValue();
    this.broadcasterId = this.twitchService['state'].broadcasterId.getValue();
    this.moderatorId = this.twitchService['state'].userId.getValue();
    this.loadModerators(this.broadcasterId!);
    this.loadVips(this.broadcasterId!);
    this.addSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
      this.refreshSearchList(this.searchQuery)
    });
  }

  onRemoveVip(user: User) {
    this.streamService.removeVip(this.broadcasterId!, user.user_id).subscribe(() => {
      this.vips = this.vips.filter(u => u.user_id !== user.user_id);
      this.refreshSearchList(this.searchQuery)
    });
  }

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.refreshSearchList(searchTerm)
  }

  private addModerator(user: User): void {
    if (!this.moderators.some((m) => m.user_id === user.user_id)) {
      this.moderators.push(user);
      this.refreshSearchList(this.searchQuery)
    }
  }

  private removeModerator(user: User): void {
    this.moderators = this.moderators.filter((m) => m.user_id !== user.user_id);
    this.refreshSearchList(this.searchQuery)
  }

  private addVip(user: User): void {
    if (!this.vips.some((m) => m.user_id === user.user_id)) {
      this.vips.push(user);
      this.refreshSearchList(this.searchQuery)
    }
  }

  private removeVip(user: User): void {
    this.vips = this.vips.filter((m) => m.user_id !== user.user_id);
    this.refreshSearchList(this.searchQuery)
  }

  private addSubscriptions() {
    this.subscriptions.add(
      this.twitchService.moderatorChanges$.subscribe((change) => {
        if (change.action === 'add' && change.user) {
          this.addModerator(change.user);
        } else if (change.action === 'remove' && change) {
          this.removeModerator(change.user!);
        }
      }),
    );
    this.subscriptions.add(
      this.twitchService.vipChanges$.subscribe((change) => {
        console.log(change);
        if (change.action === 'add' && change.user) {
          this.addVip(change.user);
        } else if (change.action === 'remove' && change) {
          this.removeVip(change.user!);
        }
      })
    )
  }

  private refreshSearchList(searchTerm: string) {
    if (searchTerm.length > 0) {
      this.searchedModerators = this.moderators.filter(user =>
        user.user_login.toLowerCase().includes(searchTerm)
      );

      this.searchedVips = this.vips.filter(user =>
        user.user_login.toLowerCase().includes(searchTerm)
      );
    }
    else {
      this.searchedModerators = [];
      this.searchedVips = [];
    }
  }
}
