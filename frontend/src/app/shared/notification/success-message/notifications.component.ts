import {Component, OnInit} from '@angular/core';
import {NotificationService} from '../../services/notification.service';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  standalone: true,
  imports: [
    NgForOf
  ],
})
export class NotificationsComponent implements OnInit {
  errorMessages: string[] = [];
  successMessages: string[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getMessages().subscribe((msg) => {
      this.errorMessages.push(msg);
      setTimeout(() => this.errorMessages.shift(), 5000);
    });

    this.notificationService.getSuccessMessages().subscribe((msg) => {
      this.successMessages.push(msg);
      setTimeout(() => this.successMessages.shift(), 5000);
    });
  }
}
