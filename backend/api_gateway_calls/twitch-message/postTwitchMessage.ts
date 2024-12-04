import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = `API_GATEWAY_REST`;

interface TwitchMessage {
    broadcasterUserId: string,
    broadcasterUserLogin: string,
    broadcasterUserName: string,
    chatterUserId: string,
    chatterUserLogin: string,
    chatterUserName: string,
    messageText: string,
    messageId: string,
    messageTimestamp: string,
}

/**
 * Forwards messages from Twitch EventSub to AWS ApiGateway
 */
export async function postMessageToApiGateway(msg: TwitchMessage, cognitoUserId: string) {
    try {

        const {client, cognitoIdToken} = getClientAndCognitoIdToken(cognitoUserId)
        if (!cognitoIdToken) {
            logger.error(`Cognito token missing for user: ${cognitoUserId}`, LOG_PREFIX);
            return;
        }

        const streamId = client.twitchData?.streamId;

        const response = await apiGatewayClient.post("/twitch-message",{
                chatter_user_login: msg.chatterUserLogin,
                message_text: msg.messageText,
                timestamp: msg.messageTimestamp,
                stream_id: streamId,
            },{
                broadcasterUserLogin: msg.broadcasterUserLogin,
                cognitoIdToken: cognitoIdToken,
            } as CustomAxiosRequestConfig
        )

        if (response.status === 200) {
            logger.info(`Message sent to API Gateway: ${msg.messageText}`, LOG_PREFIX);
        } else {
            logger.error(`Failed to send message to API Gateway. Status: ${response.status}`, LOG_PREFIX);
        }
    } catch (error: any) {
        logger.error(`Error sending message to API Gateway: ${error.message}`, LOG_PREFIX);
    }
}