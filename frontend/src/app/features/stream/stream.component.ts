import {Component} from '@angular/core';
import {ChatComponent} from "./chat/chat.component";
import {VideoComponent} from './video/video.component';
import {TwitchService} from '../twitch/twitch.service';
import {SuspiciousMessagesComponent} from './suspicious-messages/suspicious-messages.component';
import {ManagementComponent} from './managment/management.component';

@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [
    ChatComponent,
    VideoComponent,
    SuspiciousMessagesComponent,
    ManagementComponent
  ],
  templateUrl: './stream.component.html',
  styleUrl: './stream.component.css'
})
export class StreamComponent {
  selectedUser: string | null = null;

  constructor(twitchService: TwitchService) {
    this.selectedUser = twitchService.getTwitchBroadcasterUsername();
  }
}
