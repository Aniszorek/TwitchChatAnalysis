import {Component, inject} from '@angular/core';
import {SearchUserComponent} from "./search-user/search-user.component";
import {ChatWidgetComponent} from "./chat-widget/chat-widget.component";
import {AuthService} from '../auth/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    SearchUserComponent,
    ChatWidgetComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  authService = inject(AuthService);
  logout() {
    this.authService.logout();
  }
}
