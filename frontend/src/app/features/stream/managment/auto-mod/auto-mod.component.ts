import { Component, OnInit } from '@angular/core';
import { NgClass, NgForOf, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../../../shared/services/backend.service';
import { TwitchService } from '../../../twitch/twitch.service';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {AutoModSettings} from '../../../../shared/services/models/auto-mod-settings-reqeuest';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-auto-mod',
  imports: [
    NgClass,
    NgForOf,
    TitleCasePipe,
    FormsModule,
    MatIcon,
    MatTooltip
  ],
  templateUrl: './auto-mod.component.html',
  standalone: true,
  styleUrls: ['./auto-mod.component.css']
})
export class AutoModComponent implements OnInit {
  private subscriptions: Subscription = new Subscription();
  broadcasterUserId: string | null = '';
  userId: string | null = '';
  levels = [0, 1, 2, 3, 4];
  settingKeys = [
    'overall Level',
    'disability',
    'sexuality',
    'misogyny',
    'swearing',
    'racism',
    'aggression',
    'bullying',
    'sexual Content'
  ];

  selectedSettings: Record<string, number | null> = {
    'overall Level': 0,
    disability: 0,
    sexuality: 0,
    misogyny: 0,
    swearing: 0,
    racism: 0,
    aggression: 0,
    bullying: 0,
    'sexual Content': 0
  };

  private _overallEnabled = true;
  changesApplied = false;

  constructor(
    private backendService: BackendService,
    private twitchService: TwitchService
  ) {}

  ngOnInit(): void {
    this.broadcasterUserId = this.twitchService['state'].broadcasterId.getValue();
    this.userId = this.twitchService['state'].userId.getValue();
    this.loadSettings(this.broadcasterUserId!, this.userId!);

    this.subscriptions.add(
      this.twitchService.autoModSettingsChanges$.subscribe((change) => {
        if (change.autoMod) {
          this.mapFromBackend(change.autoMod);
        }
      }),
    );
  }

  loadSettings(broadcasterUserId: string, userId: string): void {
    this.backendService.getAutomodSettings(broadcasterUserId, userId).subscribe(settings => {
      this.mapFromBackend(settings.data[0]);
    });
  }

  get overallEnabled(): boolean {
    return this._overallEnabled;
  }

  set overallEnabled(value: boolean) {
    this._overallEnabled = value;
  }

  setLevel(setting: string, level: number): void {
    this.selectedSettings[setting] = level;
    this.changesApplied = true;
  }

  applyChanges(): void {
    this.changesApplied = false;
    const backendSettings: Partial<AutoModSettings> = this.overallEnabled
      ? { overall_level: this.selectedSettings['overall Level'] }
      : this.mapToBackend(this.selectedSettings);

    this.backendService
      .putAutomodSettings(this.broadcasterUserId!, this.userId!, backendSettings)
      .subscribe({
        next: (data) => {
          this.mapFromBackend(data.data[0]);
        },
        error: () => {
          this.changesApplied = true;
        }
      });
  }

  private mapFromBackend(backendSettings: AutoModSettings): void {
    this.selectedSettings = {
      'overall Level': backendSettings.overall_level,
      disability: backendSettings.disability,
      sexuality: backendSettings.sexuality_sex_or_gender,
      misogyny: backendSettings.misogyny,
      swearing: backendSettings.swearing,
      racism: backendSettings.race_ethnicity_or_religion,
      aggression: backendSettings.aggression,
      bullying: backendSettings.bullying,
      'sexual Content': backendSettings.sex_based_terms
    };

    this.overallEnabled = this.selectedSettings['overall Level'] !== null;
  }

  private mapToBackend(frontendSettings: Record<string, number | null>): Partial<AutoModSettings> {
    return {
      disability: frontendSettings['disability'],
      sexuality_sex_or_gender: frontendSettings['sexuality'],
      misogyny: frontendSettings['misogyny'],
      swearing: frontendSettings['swearing'],
      race_ethnicity_or_religion: frontendSettings['racism'],
      aggression: frontendSettings['aggression'],
      bullying: frontendSettings['bullying'],
      sex_based_terms: frontendSettings['sexual Content']
    };
  }
}
