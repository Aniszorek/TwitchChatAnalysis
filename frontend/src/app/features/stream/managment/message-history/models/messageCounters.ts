import {SentimentLabel} from '../../../../twitch/message';

export interface MessageCounters {
  [SentimentLabel.VERY_NEGATIVE]: number,
  [SentimentLabel.NEGATIVE]: number,
  [SentimentLabel.SLIGHTLY_NEGATIVE]: number,
  [SentimentLabel.VERY_POSITIVE]: number,
  [SentimentLabel.POSITIVE]: number,
  [SentimentLabel.SLIGHTLY_POSITIVE]: number,
  [SentimentLabel.NEUTRAL]: number
}
