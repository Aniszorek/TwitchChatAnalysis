export interface PostPollRequest {
  broadcaster_id: string,
  title: string,
  choices: PollChoices[],
  channel_points_voting_enabled: boolean,
  duration: number
}

export type PollChoices = {
  title: string;
}
