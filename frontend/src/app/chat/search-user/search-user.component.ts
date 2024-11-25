import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../auth/auth.service';
import {TwitchService} from '../../twitch/twitch.service';
import {NgIf} from '@angular/common';

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
export class SearchUserComponent {
  twitchService = inject(TwitchService);
  previous_username = '';
  username = 'bartes2002';
  successMessage: string | null = null;
  errorMessage: string | null = null;
  loading = false;



  constructor() {
    this.twitchService.searchUserState$.subscribe((state) => {
      if (state) {
        if (state.success) {
          this.errorMessage = null;
          this.successMessage = state.message || 'Operation successful.';
        } else {
          this.errorMessage = state.errorMessage || 'Unknown error occurred';
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
      this.previous_username = this.username;
      this.loading = true;
      this.twitchService.searchUser(this.username);
    }
  }
}
