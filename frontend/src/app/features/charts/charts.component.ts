import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {BaseChartDirective} from 'ng2-charts';
import {
  ChartOptions,
} from 'chart.js';
import {AuthService} from '../../auth/auth.service';
import {TwitchService} from '../twitch/twitch.service';
import {KeysService} from './services/keys.service';
import {ChartService} from './services/chart.service';
import {AppState} from './models/chart-enums.model';
import {ActivatedRoute} from '@angular/router';
import {BackendService} from '../../shared/services/backend.service';


// todo TCA-106 dodałabym opcje usuwania danych z jakiegoś streama bo teraz mamy nasrane pustymi wykresami
@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    BaseChartDirective,
    DatePipe
  ],
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent implements OnInit {
  private readonly timeFormatter: Intl.DateTimeFormat
  protected AppState = AppState;
  protected appState: AppState = AppState.streamDataLoading;
  protected streams: any[] = [];
  protected streamId: string = '';
  protected broadcasterUserLogin: string | null;
  protected authorization: string | null;
  protected metadata: any = null;
  protected selectedDataKeys: string[] = [];
  protected availableDataKeys: string[] = [];
  protected chartData: any = [];
  protected selectedStream: any = null;
  protected chartLabels: string[] = [];
  protected chartOptions: ChartOptions<'line'> = {};

  protected selectedAggregationKeys: { [key: string]: boolean };
  protected readonly keyDisplayNames: { [key: string]: { displayName: string; tooltip: string } }
  protected readonly aggregationKeys: string[];
  protected readonly relatedKeysMap: { [key: string]: string[] };

  constructor(
    private readonly backendService: BackendService,
    private readonly authService: AuthService,
    private readonly twitchService: TwitchService,
    private readonly keysService: KeysService,
    private readonly chartService: ChartService,
    private readonly route: ActivatedRoute
  ) {
    this.authorization = this.authService.getIdToken();
    this.broadcasterUserLogin = this.twitchService['state'].broadcasterUsername.getValue();
    this.timeFormatter = new Intl.DateTimeFormat('default', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.aggregationKeys = this.keysService.getAggregationKeys();
    this.selectedAggregationKeys = this.keysService.getSelectedAggregationKeys();
    this.relatedKeysMap = this.keysService.getRelatedKeysMap()
    this.keyDisplayNames = this.keysService.getKeyDisplayNames()
  }

  ngOnInit(): void {
    this.loadStreams();
  }

  setAppState(state: AppState) {
    this.appState = state;
  }

  getAppState() {
    return this.appState;
  }

  protected isMainKeySelected(key: string): boolean {
    return this.keysService.isMainKeySelected(key, this.selectedDataKeys);
  }

  protected isKeySelectedForAggregation(key: string): boolean {
    return this.selectedAggregationKeys[key];
  }

  protected toggleAggregationKey(key: string, event: any): void {
    this.selectedAggregationKeys[key] = !this.selectedAggregationKeys[key];

    const mainKey = this.keysService.getMainKeyForAggregation(key);

    if (this.keysService.areAllRelatedKeysOff(mainKey, this.selectedAggregationKeys)) {
      this.removeMainKeyFromSelectedDataKeys(mainKey);
    }

    this.updateChart();
  }

  selectStream(streamId: string) {
    this.setAppState(AppState.metadataLoading);
    this.streamId = streamId;
    this.loadStreamData(streamId);
  }

  toggleDataKey(key: string) {
    const isKeySelected = this.isKeySelected(key);

    if (key === 'negative_message_count' || key === 'positive_message_count') {
      this.selectedAggregationKeys = this.keysService.getSelectedAggregationKeysWithMainKey(key, isKeySelected, this.selectedAggregationKeys);
    }

    this.selectedDataKeys = isKeySelected
      ? this.selectedDataKeys.filter(k => k !== key)
      : [...this.selectedDataKeys, key];

    this.updateChart();
  }

  protected isKeySelected(key: string): boolean {
    return this.selectedDataKeys.includes(key);
  }

  private loadStreamData(streamId: string) {
    if (!this.broadcasterUserLogin) {
      console.warn("broadcasterUserLogin empty");
      return
    }
    this.selectedStream = this.streams.find((stream) => stream.stream_id === streamId);

    this.backendService
      .getStreamMetadata(streamId, this.broadcasterUserLogin)
      .subscribe((data) => {
        if (!data) {
          this.setAppState(AppState.metadataNotAvailable)
          console.warn("No data available for stream");
          return
        }

        this.metadata = data;
        this.availableDataKeys = this.keysService.getAvailableKeys(this.metadata);
        this.selectedDataKeys = this.keysService.getDefaultSelectedKeys(this.selectedDataKeys, this.availableDataKeys);
        this.setAppState(AppState.ready)
        this.updateChart();
      });
  }

  private removeMainKeyFromSelectedDataKeys(mainKey: string): void {
    const index = this.selectedDataKeys.indexOf(mainKey);
    if (index !== -1) {
      this.selectedDataKeys.splice(index, 1);
    }
  }


  private loadStreams(): void {
    if (!this.broadcasterUserLogin) {
      console.warn("broadcasterUserLogin empty");
      return
    }
    this.streams = this.route.snapshot.data['streamData'];
    if (this.streams && this.streams.length > 0) {
      this.streams = [...this.streams].sort((a, b) => {
        const timeA = new Date(a.started_at).getTime();
        const timeB = new Date(b.started_at).getTime();
        return timeB - timeA;
      });
      this.selectFirstStream();
    } else {
      this.setAppState(AppState.streamDataNotAvailable);
    }
  }

  private selectFirstStream() {
    if (this.streams.length > 0) {
      this.selectStream(this.streams[0].stream_id);
    }
  }

  private updateChart() {
    const aggregatedData = this.calculateAggregatedData();

    const {chartData, chartLabels, chartOptions} = this.chartService.updateChart(
      this.metadata,
      this.selectedDataKeys,
      this.keyDisplayNames,
      this.timeFormatter,
      aggregatedData
    );

    this.chartData = chartData;
    this.chartLabels = chartLabels;
    this.chartOptions = chartOptions;
  }


  private calculateAggregatedData(): { [key: string]: number[] } {
    const aggregatedData: { [key: string]: number[] } = {
      negative_message_count: [],
      positive_message_count: [],
      neutral_message_count: [],
    };

    if (!this.metadata || this.metadata.length === 0) {
      console.warn('Metadata is null or empty. Skipping aggregation.');
      return aggregatedData;
    }

    this.metadata.forEach((entry: any) => {
      const negativeSum = this.keysService.calculateSum(entry, 'negative_message_count', this.selectedAggregationKeys);
      const positiveSum = this.keysService.calculateSum(entry, 'positive_message_count', this.selectedAggregationKeys);

      aggregatedData['negative_message_count'].push(negativeSum);
      aggregatedData['positive_message_count'].push(positiveSum);
    });

    return aggregatedData;
  }

}
