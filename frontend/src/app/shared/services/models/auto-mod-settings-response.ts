export interface AutoModSettingsResponse {
  data: {
    aggression: number | null;
    bullying: number | null;
    disability: number | null;
    misogyny: number | null;
    overall_level: number | null;
    race_ethnicity_or_religion: number | null;
    sex_based_terms: number | null;
    sexuality_sex_or_gender: number | null;
    swearing: number | null;
  }[]
}
