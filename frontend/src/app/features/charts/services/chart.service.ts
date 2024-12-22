import { Injectable } from '@angular/core';
import {
  CategoryScale,
  Chart,
  ChartOptions, Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement, Title,
  Tooltip
} from 'chart.js';
import Annotation from 'chartjs-plugin-annotation';

@Injectable({
  providedIn: 'root',
})
export class ChartService {

  constructor() {
    Chart.register(
      LineController,
      LineElement,
      PointElement,
      LinearScale,
      CategoryScale,
      Tooltip,
      Title,
      Legend,
      Annotation
    );
  }

  updateChart(metadata: any[],
              selectedDataKeys: string[],
              keyDisplayNames: { [key: string]: { displayName: string } },
              timeFormatter: Intl.DateTimeFormat,
              aggregatedData: { [key: string]: number[] }):
    { chartData: any[], chartLabels: string[], chartOptions: ChartOptions<'line'> } {

    const chartData = selectedDataKeys.map((key) => {
      const data = this.getDataForKey(key, aggregatedData, metadata);
      return {
        label: keyDisplayNames[key]?.displayName || key,
        data: data,
        borderColor: this.getBrightColor(key),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        pointBorderColor: this.getBrightColor(key),
        pointBackgroundColor: this.getBrightColor(key),
        fill: false,
      };
    });

    const chartLabels = metadata.map((entry: any) => {
      return timeFormatter.format(new Date(entry.timestamp));
    });

    const chartOptions = this.getChartOptions(metadata);

    return { chartData, chartLabels, chartOptions };
  }

  private getDataForKey(key: string, aggregatedData: { [key: string]: number[] }, metadata: any[]): number[] {
    if (['negative_message_count', 'positive_message_count'].includes(key)) {
      return aggregatedData[key];
    }
    return metadata.map((entry: any) => entry.metadata[key]);
  }

  private getBrightColor(key: string): string {

    const colorMap: { [key: string]: string } = {
      "viewer_count": '#36a2eb',
      "message_count": '#ffce56',
      "follower_count": '#cc65fe',
      "subscriber_count": '#ff9f40',
      "neutral_message_count": '#4bc0c0',
      "negative_message_count": '#ff6384',
      "positive_message_count": '#4caf50',
    };

    return colorMap[key]
  }

  private getChartOptions(metadata: any[]): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#ffffff',
          },
        },
        tooltip: {
          callbacks: {
            title: (tooltipItems: any) => {
              const index = tooltipItems[0].dataIndex;
              const category = metadata[index]?.metadata.category || 'N/A';
              return `Category: ${category}`;
            },
            label: (tooltipItem: any) => {
              const datasetLabel = tooltipItem.dataset.label || '';
              const value = tooltipItem.raw;
              return `${datasetLabel}: ${value}`;
            },
          },
        },
        annotation: {
          annotations: this.getCategoryAnnotations(metadata),
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#ffffff',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
        y: {
          ticks: {
            color: '#ffffff',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    };
  }

  private getCategoryAnnotations(metadata: any[]): any[] {
    const annotations: any[] = [];
    let lastCategory = '';
    metadata.forEach((entry: any, index: number) => {
      const category = entry.metadata.category;
      if (category !== lastCategory) {
        annotations.push({
          type: 'line',
          mode: 'vertical',
          scaleID: 'x',
          value: index,
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 2,
          borderDash: [8, 8],
          label: {
            rotation: 90,
            display: true,
            content: category,
            position: 'start',
            color: '#ffffff',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
        });
        lastCategory = category;
      }
    });
    return annotations;
  }
}
