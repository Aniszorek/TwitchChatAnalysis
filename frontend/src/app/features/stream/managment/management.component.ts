import {Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {Tab} from '../../twitch/permissions.config';
import {NgIf} from '@angular/common';
import {TwitchService} from '../../twitch/twitch.service';

@Component({
  selector: 'app-management',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIf
  ],
  templateUrl: './management.component.html',
  standalone: true,
  styleUrl: './management.component.css'
})
export class ManagementComponent {
  twitchService = inject(TwitchService);
  protected readonly Tab = Tab;
}
