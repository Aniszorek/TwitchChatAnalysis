import {Component, inject, Input, OnInit} from '@angular/core';
import {NgClass, NgIf} from '@angular/common';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {TwitchService} from '../../twitch/twitch.service';
import {Tab} from '../../twitch/permissions.config';

@Component({
  selector: 'app-stream-video',
  standalone: true,
  templateUrl: './video.component.html',
  imports: [
    NgIf,
    NgClass
  ],
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit {
  @Input() channelName: string | null = null;
  safeUrl: SafeResourceUrl | null = null;
  twitchService = inject(TwitchService);

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    if (this.channelName) {
      const parentDomain = location.hostname;
      const embedUrl = `https://player.twitch.tv/?channel=${this.channelName}&parent=${parentDomain}`;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      console.log('Safe URL set:', this.safeUrl);
    }
  }

  protected readonly Tab = Tab;
}
