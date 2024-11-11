import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../auth/auth.service';
import {TwitchService} from '../../auth/twitch.service';

@Component({
  selector: 'app-search-user',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './search-user.component.html',
  styleUrl: './search-user.component.css'
})
export class SearchUserComponent {
  twitchService = inject(TwitchService);
  username = 'bartes2002';

  searchUser() {
    if (this.username) {
      this.twitchService.searchUser(this.username);
    }
  }
}
