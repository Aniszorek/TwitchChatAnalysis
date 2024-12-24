import {Component, OnInit} from '@angular/core';
import {NotificationService} from '../../notification.service';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-success-message',
  templateUrl: './success-message.component.html',
  standalone: true,
  imports: [
    NgForOf
  ],
})
export class SuccessMessageComponent implements OnInit {
  messages: string[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getSuccessMessages().subscribe((msg) => {
      this.messages.push(msg);
      setTimeout(() => {
        this.messages.shift();
      }, 5000);
    });
  }
}
