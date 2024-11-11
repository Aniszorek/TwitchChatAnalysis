import { Component } from '@angular/core';
import {SearchUserComponent} from "./search-user/search-user.component";
import {ChatWidgetComponent} from "./chat-widget/chat-widget.component";

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

}
