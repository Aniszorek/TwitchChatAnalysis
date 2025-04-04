export interface AutomodSettingsResponse {
    data: {
        broadcaster_id: string;
        moderator_id: string;
        overall_level: number;
        disability: number;
        aggression: number;
        sexuality_sex_or_gender: number;
        misogyny: number;
        bullying: number;
        swearing: number;
        race_ethnicity_or_religion: number;
        sex_based_terms: number;
    }
}