import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { MatIcon } from "@angular/material/icon";
import { NgForOf, NgIf } from "@angular/common";
import { BlockedTerm } from '../../../../shared/services/models/blocked-term';
import { TwitchService } from '../../../twitch/twitch.service';
import { BackendService } from '../../../../shared/services/backend.service';
import { PostBlockedTermRequest } from '../../../../shared/services/models/blocked-terms-request';

@Component({
  selector: 'app-blocked-terms',
  imports: [
    FormsModule,
    MatIcon,
    NgForOf,
    NgIf
  ],
  templateUrl: './blocked-terms.component.html',
  standalone: true,
  styleUrl: './blocked-terms.component.css'
})
export class BlockedTermsComponent implements OnInit {
  broadcasterId: string | null = '';
  userId: string | null = '';
  blockedTerms: BlockedTerm[] = [];
  newTerm: string = '';
  existingTerm: BlockedTerm | null = null;

  constructor(private readonly twitchService: TwitchService,
              private readonly backendService: BackendService) {
  }

  ngOnInit(): void {
    this.broadcasterId = this.twitchService['state'].broadcasterId.getValue();
    this.userId = this.twitchService['state'].userId.getValue();
    this.fetchBlockedTerms(this.broadcasterId!, this.userId!);
  }

  addTerm() {
    if (this.existingTerm) {
      return;
    }

    const body: PostBlockedTermRequest = {
      text: this.newTerm.trim()
    };

    this.backendService.postBlockedTerm(this.broadcasterId!, this.userId!, body).subscribe((data) => {
      if (data) {
        this.blockedTerms.push(data.data[0]);
        this.newTerm = '';
      }
    });
  }

  private fetchBlockedTerms(broadcasterId: string, userId: string) {
    this.backendService.getBlockedTerms(broadcasterId, userId).subscribe((data) => {
      this.blockedTerms = data;
    });
  }

  checkExistingTerm() {
    this.existingTerm = this.blockedTerms.find(term => term.text === this.newTerm.trim()) || null;
  }

  removeTerm(term: BlockedTerm) {
    this.backendService.deleteBlockedTerm(this.broadcasterId!, this.userId!, term.id).subscribe(() => {
      this.blockedTerms = this.blockedTerms.filter(t => t.id !== term.id);
    });
  }
}
