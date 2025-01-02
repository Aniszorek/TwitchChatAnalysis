import {Component, EventEmitter, inject, OnInit, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TwitchService} from '../twitch/twitch.service';
import {NgIf} from '@angular/common';
import {Router} from '@angular/router';
import {Tab} from '../twitch/permissions.config';
import {BackendService} from '../../shared/services/backend.service';

@Component({
  selector: 'app-search-user',
  standalone: true,
  imports: [
    FormsModule,
    NgIf
  ],
  templateUrl: './search-user.component.html',
  styleUrl: './search-user.component.css'
})
export class SearchUserComponent implements OnInit {
  twitchService = inject(TwitchService);
  streamService = inject(BackendService)
  router = inject(Router);
  previousUsername = '';
  username = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;
  loading = false;
  loadingUsername = false;
  @Output() userSelected = new EventEmitter<string>();

  ngOnInit(): void {
    this.twitchService.resetLoadingAndState();
    this.errorMessage = null;

    this.loadingUsername = true;

    this.streamService.getTwitchUserInfo().subscribe({
        next: response => {
          this.username = response.data[0]['display_name'];
          this.loadingUsername = false;
        },
        error: error => {
          this.loadingUsername = false;
        }
      }
    );

    this.twitchService.searchUserState$.subscribe((state) => {
      if (state) {
        if (state.success) {
          this.errorMessage = null;
          this.successMessage = state.message ?? 'Operation successful.';
          this.twitchService['state'].broadcasterUsername.next(this.username.toLowerCase());
          console.log('Redirecting');
          let role;
          if (this.twitchService.canAccess(Tab.SUSPENDED)) {
            console.log("streamer")
            this.router.navigate(['/stream/suspended']);
          } else if (this.twitchService.canAccess(Tab.AUTOMOD)) {
            console.log("mod")
            this.router.navigate(['/stream/auto-mod']);
          } else {
            console.log("viewer")
            this.router.navigate(['/stream']);
          }

        } else {
          console.log("stan", state)
          this.errorMessage = state.message ?? 'Unknown error occurred';
          this.successMessage = null;
        }
      }
    });

    this.twitchService.loadingState$.subscribe((loadingState) => {
      this.loading = loadingState;
    });
  }

  searchUser() {
    if (this.username) {
      this.previousUsername = this.username;
      this.loading = true;
      this.twitchService.searchUser(this.username.toLowerCase());
    }
  }

  get isDisabled(): boolean {
    return this.loading || this.username.trim() === this.previousUsername.trim() || this.username.trim().length === 0 || this.loadingUsername;
  }
}
