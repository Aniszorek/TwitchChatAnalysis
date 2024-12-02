import {Component} from '@angular/core';
import {SearchUserComponent} from "./search-user/search-user.component";
import {ChatComponent} from "./chat/chat.component";
import {VideoComponent} from './video/video.component';

@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [
    SearchUserComponent,
    ChatComponent,
    VideoComponent,
  ],
  templateUrl: './stream.component.html',
  styleUrl: './stream.component.css'
})
export class StreamComponent {
  selectedUser: string | null = null;

  onUserSelected(username: string) {
    this.selectedUser = username;
    console.log('Received username:', username);
  }
}
