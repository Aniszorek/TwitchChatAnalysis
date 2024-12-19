export interface Message {
  broadcasterUserId: string;
  broadcasterUserLogin: string;
  broadcasterUserName: string;
  chatterUserId: string;
  chatUserLogin: string;
  chatUserName: string;
  messageId: string;
  messageText: string;
  messageTimestamp: string;
}

export interface NlpChatMessage {
  streamId: string;
  broadcasterUserLogin: string;
  chatUserLogin: string;
  messageText: string;
  timestamp: string;
  nlpClassification: SentimentLabel;
  messageId: string;
}

export enum SentimentLabel {
  VERY_NEGATIVE = "Very Negative",
  NEGATIVE = "Negative",
  SLIGHTLY_NEGATIVE = "Slightly Negative",
  NEUTRAL = "Neutral",
  SLIGHTLY_POSITIVE = "Slightly Positive",
  POSITIVE = "Positive",
  VERY_POSITIVE = "Very Positive"
}

export const negativeClasses: SentimentLabel[] = [
  SentimentLabel.VERY_NEGATIVE,
  SentimentLabel.NEGATIVE,
  SentimentLabel.SLIGHTLY_NEGATIVE
];
