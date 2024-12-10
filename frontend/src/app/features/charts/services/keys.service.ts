import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class KeysService {

  getRelatedKeysMap(): { [key: string]: string[] } {
    return this.relatedKeysMap;
  }

  getAggregationKeys(): string[] {
    return this.aggregationKeys;
  }

  getKeyDisplayNames(): { [key: string]: { displayName: string; tooltip: string } } {
    return this.keyDisplayNames;
  }

  getSelectedAggregationKeys(): { [key: string]: boolean } {
    return this.selectedAggregationKeys;
  }

  getRelatedKeys(key: string): string[] {
    return this.relatedKeysMap[key] || [];
  }

  getSingleValue(entry: any, key: string, selectedAggregationKeys: any): number {
    return selectedAggregationKeys[key] ? (entry.metadata[key] ?? 0) : 0;
  }

  getSelectedAggregationKeysWithMainKey(
    mainKey: string,
    isSelected: boolean,
    selectedKeys: { [key: string]: boolean }
  ): { [key: string]: boolean } {
    const relatedKeys = this.getRelatedKeys(mainKey);
    relatedKeys.forEach((relatedKey) => {
      selectedKeys[relatedKey] = !isSelected;
    });
    return selectedKeys;
  }

  isMainKeySelected(key: string, selectedDataKeys: string[]): boolean {
    const isNegativeMessageKey = this.relatedKeysMap['negative_message_count'].includes(key);
    const isNegativeMessageSelected = selectedDataKeys.includes('negative_message_count');

    const isPositiveMessageKey = this.relatedKeysMap['positive_message_count'].includes(key);
    const isPositiveMessageSelected = selectedDataKeys.includes('positive_message_count');

    if (isNegativeMessageKey && isNegativeMessageSelected) {
      return true;
    }

    return isPositiveMessageKey && isPositiveMessageSelected;

  }

  getMainKeyForAggregation(key: string): string {
    return this.isKeyRelatedToNegativeMessages(key) ? 'negative_message_count' : 'positive_message_count';
  }

  areAllRelatedKeysOff(mainKey: string, selectedAggregationKeys: any): boolean {
    return this.relatedKeysMap[mainKey].every(relatedKey => !selectedAggregationKeys[relatedKey]);
  }

  calculateSum(entry: any, mainKey: string, selectedAggregationKeys: any): number {
    const relatedKeys = this.relatedKeysMap[mainKey] || [mainKey];
    return relatedKeys.reduce((sum, key) => {
      return sum + (selectedAggregationKeys[key] ? (entry.metadata[key] ?? 0) : 0);
    }, 0);
  }

  getAvailableKeys(metadata: any[]): string[] {
    return Object.keys(metadata[0]?.metadata || []).filter(
      (key) =>
        key !== 'category' &&
        key !== 'slightly_negative_message_count' &&
        key !== 'very_negative_message_count' &&
        key !== 'slightly_positive_message_count' &&
        key !== 'very_positive_message_count'
    );
  }

  getDefaultSelectedKeys(selectedKeys: string[], availableKeys: string[]): string[] {
    if (selectedKeys.length === 0 && availableKeys.length > 0) {
      return [availableKeys[0]];
    }
    return selectedKeys.filter((key) => availableKeys.includes(key));
  }

  private isKeyRelatedToNegativeMessages(key: string): boolean {
    return this.relatedKeysMap['negative_message_count'].includes(key);
  }

  private readonly selectedAggregationKeys: { [key: string]: boolean } = {
    very_negative_message_count: false,
    slightly_negative_message_count: false,
    negative_message_count: false,
    very_positive_message_count: false,
    slightly_positive_message_count: false,
    positive_message_count: false,
  };

  private readonly aggregationKeys = [
    'negative_message_count',
    'very_negative_message_count',
    'slightly_negative_message_count',
    'positive_message_count',
    'very_positive_message_count',
    'slightly_positive_message_count',
  ];

  private readonly keyDisplayNames: { [key: string]: { displayName: string; tooltip: string } } = {
    viewer_count: {displayName: 'Viewer Count', tooltip: 'Number of viewers watching the stream'},
    message_count: {displayName: 'Message Count', tooltip: 'Total messages sent in chat'},
    follower_count: {displayName: 'Follower Count', tooltip: 'Number of followers gained'},
    subscriber_count: {displayName: 'Subscriber Count', tooltip: 'Number of subscribers gained'},
    neutral_message_count: {displayName: 'Neutral Messages', tooltip: 'Messages classified as neutral'},
    negative_message_count: {displayName: 'Negative Messages', tooltip: 'Messages classified as negative'},
    positive_message_count: {displayName: 'Positive Messages', tooltip: 'Messages classified as positive'},
    very_negative_message_count: {
      displayName: 'Very Negative Messages',
      tooltip: 'Messages classified as very negative'
    },
    slightly_negative_message_count: {
      displayName: 'Slightly Negative Messages',
      tooltip: 'Messages classified as slightly negative'
    },
    slightly_positive_message_count: {
      displayName: 'Slightly Positive Messages',
      tooltip: 'Messages classified as slightly positive'
    },
    very_positive_message_count: {
      displayName: 'Very Positive Messages',
      tooltip: 'Messages classified as very positive'
    },
  };

  private readonly relatedKeysMap: { [key: string]: string[] } = {
    negative_message_count: [
      'very_negative_message_count',
      'slightly_negative_message_count',
      'negative_message_count',
    ],
    positive_message_count: [
      'very_positive_message_count',
      'slightly_positive_message_count',
      'positive_message_count',
    ],
  };


}
