import {Component} from '@angular/core';
import {ChatComponent} from "./chat/chat.component";
import {VideoComponent} from './video/video.component';
import {TwitchService} from '../twitch/twitch.service';

@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [
    ChatComponent,
    VideoComponent,
  ],
  templateUrl: './stream.component.html',
  styleUrl: './stream.component.css'
})
export class StreamComponent {
  selectedUser: string | null = null;

  constructor(twitchService: TwitchService) {
    this.selectedUser = twitchService.getTwitchUsername();
  }
}
