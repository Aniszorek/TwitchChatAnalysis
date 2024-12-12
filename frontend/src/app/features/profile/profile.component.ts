import {Component, inject, OnInit} from '@angular/core';
import {urls} from '../../app.config';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  standalone: true,
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  route = inject(ActivatedRoute)

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => this.handleTwitchTokenCallback(params));
  }

  private handleTwitchTokenCallback(params: any): void {
     console.log(params);
  }



  generateToken() {
    window.location.replace(urls.twitchOauthGenerate);
  }
}
