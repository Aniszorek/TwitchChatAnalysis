import { Component, OnInit } from '@angular/core';
import {NotificationService} from '../shared/services/notification.service';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  standalone: true,
  imports: [
    NgForOf
  ],
  styleUrls: ['./error-message.component.css']
})
export class ErrorMessageComponent implements OnInit {
  messages: string[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getMessages().subscribe((msg) => {
      this.messages.push(msg);
      setTimeout(() => {
        this.messages.shift();
      }, 5000);
    });
  }
}
