import {Component, EventEmitter, Input, Output} from '@angular/core';
import {User} from '../../../../managment/suspended/models/suspended.model';
import {ModActionButtonsComponent} from '../mod-action-buttons.component';

@Component({
  selector: 'app-ban-wrapper',
  imports: [
    ModActionButtonsComponent
  ],
  templateUrl: './ban-wrapper.component.html',
  styleUrl: './ban-wrapper.component.css',
  standalone: true
})
export class BanWrapperComponent {
  @Input() userData!: User;
  @Output() ban = new EventEmitter<{ minutes: number, reason: string, userData: User }>();

  banUser({ minutes, reason }: { minutes: number; reason: string }) {
    this.ban.emit({ minutes, reason, userData: this.userData });
  }

}
