import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

export type PutAutomodSettingsPayload = {
    aggression?: number;
    bullying?: number;
    disability?: number;
    misogyny?: number;
    overall_level?: number;
    race_ethnicity_or_religion?: number;
    sex_based_terms?: number;
    sexuality_sex_or_gender?: number;
    swearing?: number;

}

// Requires a user access token that includes the moderator:manage:automod_settings scope.
// moderator_id		The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room.
// This ID must match the user ID in the user access token.
export const putAutomodSettings = async (queryParams:any, payload: PutAutomodSettingsPayload) => {
    try {
        const result = await twitchApiClient.put('/moderation/automod/settings', payload, {
            params: queryParams
        })
        return result.data
    } catch (error: any) {
        console.log(error)
        logger.error(`Error patching chat settings`, LOG_PREFIX);
        throw error;
    }
};

export const isPutAutomodSettingsPayload = (obj: any): obj is PutAutomodSettingsPayload => {
    const allowedKeys = [
        "aggression",
        "bullying",
        "disability",
        "misogyny",
        "overall_level",
        "race_ethnicity_or_religion",
        "sex_based_terms",
        "sexuality_sex_or_gender",
        "swearing",
    ];

    if (typeof obj !== "object" || obj === null) {
        throw Error(`Object is not valid: ${JSON.stringify(obj)}`);
    }

    for (const key of Object.keys(obj)) {
        if (!allowedKeys.includes(key)) {
            throw Error(`Object contains invalid key: ${key}`);
        }
    }

    const isValid = Object.entries(obj).every(([key, value]) => {
        switch (key) {
            case "aggression":
            case "bullying":
            case "disability":
            case "misogyny":
            case "overall_level":
            case "race_ethnicity_or_religion":
            case "sex_based_terms":
            case "sexuality_sex_or_gender":
            case "swearing":
                return typeof value === "number";
            default:
                return false;
        }
    });

    if (!isValid) {
        throw Error(`Object contains invalid values: ${JSON.stringify(obj)}`);
    }

    return true;
};