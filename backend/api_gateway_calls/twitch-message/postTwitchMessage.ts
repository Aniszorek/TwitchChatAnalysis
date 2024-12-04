import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";

const LOG_PREFIX = `API_GATEWAY_REST: `;

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
            console.error(`${LOG_PREFIX} Cognito token missing for user: ${cognitoUserId}`);
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
            console.log(`${LOG_PREFIX} Message sent to API Gateway: ${msg.messageText}`);
        } else {
            console.error(`${LOG_PREFIX} Failed to send message to API Gateway. Status: ${response.status}`);
        }
    } catch (error: any) {
        console.error(`${LOG_PREFIX} Error sending message to API Gateway: ${error.message}`);
    }
}