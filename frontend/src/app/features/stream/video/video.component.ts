import {Component, Input, OnInit} from '@angular/core';
import {NgIf} from '@angular/common';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-stream-video',
  standalone: true,
  templateUrl: './video.component.html',
  imports: [
    NgIf
  ],
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit {
  @Input() channelName: string | null = null;
  safeUrl: SafeResourceUrl | null = null;

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    if (this.channelName) {
      const parentDomain = location.hostname;
      const embedUrl = `https://player.twitch.tv/?channel=${this.channelName}&parent=${parentDomain}`;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      console.log('Safe URL set:', this.safeUrl);
    }
  }
}
