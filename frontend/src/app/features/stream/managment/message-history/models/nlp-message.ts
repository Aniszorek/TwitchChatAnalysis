import {SentimentLabel} from '../../../../twitch/message';

export interface NlpMessage {
  broadcaster_user_login: string,
  chatter_user_login: string,
  message_id: string,
  message_text: string,
  nlp_classification: SentimentLabel,
  stream_id: string,
  timestamp: string
}
