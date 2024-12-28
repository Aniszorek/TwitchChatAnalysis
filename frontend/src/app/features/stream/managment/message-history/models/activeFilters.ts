import {SentimentLabel} from '../../../../twitch/message';

export interface ActiveFilters {
  [SentimentLabel.VERY_NEGATIVE]: boolean,
  [SentimentLabel.NEGATIVE]: boolean,
  [SentimentLabel.SLIGHTLY_NEGATIVE]: boolean,
  [SentimentLabel.VERY_POSITIVE]: boolean,
  [SentimentLabel.POSITIVE]: boolean,
  [SentimentLabel.SLIGHTLY_POSITIVE]: boolean,
  [SentimentLabel.NEUTRAL]: boolean
}
