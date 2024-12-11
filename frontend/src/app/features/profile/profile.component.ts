import { Component } from '@angular/core';
import {urls} from '../../app.config';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  standalone: true,
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

  generateToken() {
    window.location.replace(urls.twitchOauthGenerate);
  }
}
