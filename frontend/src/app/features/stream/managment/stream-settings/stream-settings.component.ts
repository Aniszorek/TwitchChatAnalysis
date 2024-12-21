import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {BackendService} from '../../../../shared/services/backend.service';
import {TwitchService} from '../../../twitch/twitch.service';
import {ChannelInfo} from './models/channel.info';
import {NgForOf, NgIf} from '@angular/common';
import {Category} from './models/category';
import {ChannelInfoRequest} from '../../../../shared/services/models/channel-info-request';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-stream-settings',
  imports: [
    MatIcon,
    NgForOf,
    NgIf,
    FormsModule
  ],
  templateUrl: './stream-settings.component.html',
  standalone: true,
  styleUrl: './stream-settings.component.css'
})
export class StreamSettingsComponent implements OnInit{
  broadcasterUserId: string | null = '';
  isEditingTitle: boolean = false;
  channelInfo: ChannelInfo | null = null;
  categories: Category[] = [];
  private currentTag: string = '';

  @ViewChild('titleInput') titleInput!: ElementRef<HTMLTextAreaElement>;

  constructor(private readonly backendService: BackendService,
              private readonly twitchService: TwitchService) {
  }

  ngOnInit(): void {
    this.broadcasterUserId = this.twitchService['state'].broadcasterId.getValue();
    this.fetchChannelInfo();
  }

  fetchChannelInfo() {
    this.backendService.getChannelInformation(this.broadcasterUserId!).subscribe((data) => {
      this.channelInfo = data.data[0];
      console.log(this.channelInfo);

      setTimeout(() => {
        if (this.titleInput?.nativeElement) {
          this.adjustHeight();
        }
      });
    });
  }

  adjustHeight(): void {
    this.titleInput.nativeElement.style.height = 'auto';
    this.titleInput.nativeElement.style.height = `${this.titleInput.nativeElement.scrollHeight}px`;
  }

  addTag(): void {
    if (this.currentTag && !this.channelInfo!.tags.includes(this.currentTag)) {
      this.channelInfo!.tags.push(this.currentTag);
      this.currentTag = '';
    }
  }

  removeTag(tag: string): void {
    this.channelInfo!.tags = this.channelInfo!.tags.filter(t => t !== tag);
  }

  updateTag(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.currentTag = inputElement.value;
  }

  toggleEditTitle() {
    this.isEditingTitle = !this.isEditingTitle;
  }

  updateTitle(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.channelInfo!.title = inputElement.value;
  }

  searchCategories(event: Event): void {
    const query = (event.target as HTMLInputElement).value.trim();
    if (query.length >= 2) {
      this.backendService.searchCategories(query).subscribe({
        next: (results) => {
          this.categories = results.data;
          },
        error: (err) => {
          console.error('Error searching categories:', err);
        }
      });
    } else {
      this.categories = [];
    }
  }

  selectCategory(category: { id: number; name: string }): void {
    this.channelInfo!.game_name = category.name;
    this.channelInfo!.game_id = category.id;
    this.categories = [];
  }

  applyChanges() {
    this.isEditingTitle = false;
    const data: ChannelInfoRequest = {
      game_id: this.channelInfo!.game_id,
      tags: this.channelInfo!.tags,
      title: this.channelInfo!.title,
      broadcaster_language: this.channelInfo!.broadcaster_language
    }
    this.backendService.patchChannelInformation(this.broadcasterUserId!, data!).subscribe(() => {
    });
  }
}
