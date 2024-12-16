import axios from 'axios';
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_AUTH';
const TWITCH_VALIDATE_AUTH_URL = 'https://id.twitch.tv/oauth2/validate';


/**
 * Validates the OAuth token for the Twitch bot
 */
export async function validateTwitchAuth(headers: any) {
    try {
        return await axios.get(TWITCH_VALIDATE_AUTH_URL, {
            headers: {
                ...headers
            },
        });

    } catch (error: any) {
        logger.error(`Error validating token: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}

