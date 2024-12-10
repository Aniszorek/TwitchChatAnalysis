import {Component, EventEmitter, inject, OnInit, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TwitchService} from '../twitch/twitch.service';
import {NgIf} from '@angular/common';
import {Router} from '@angular/router';

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
  router = inject(Router);
  previousUsername = '';
  username = 'bartes2002';
  successMessage: string | null = null;
  errorMessage: string | null = null;
  loading = false;
  @Output() userSelected = new EventEmitter<string>();

  ngOnInit(): void {
    this.twitchService.resetLoadingAndState();
    this.errorMessage = null;

    this.twitchService.searchUserState$.subscribe((state) => {
      if (state) {
        if (state.success) {
          this.errorMessage = null;
          this.successMessage = state.message ?? 'Operation successful.';
          this.twitchService.setTwitchUsername(this.username.toLowerCase());
          console.log('Redirecting');
          this.router.navigate(['/stream']);
        } else {
          this.errorMessage = state.errorMessage ?? 'Unknown error occurred';
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
    return this.loading || this.username.trim() === this.previousUsername.trim() || this.username.trim().length === 0;
  }
}
