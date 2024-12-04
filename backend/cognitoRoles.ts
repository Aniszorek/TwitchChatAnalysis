import {frontendClients} from "./bot/frontendClients";
import {LogColor, logger, LogStyle} from "./utilities/logger";

export const COGNITO_ROLES = {
    STREAMER: "Streamer",
    MODERATOR: "Moderator",
    VIEWER: "Viewer"
};

type CognitoRole = typeof COGNITO_ROLES[keyof typeof COGNITO_ROLES];


interface UserData {
    twitchData: {
        twitchRole: CognitoRole;
    };
    cognito: {
        cognitoUsername: string;
    };
}

const LOG_PREFIX = "COGNITO_ROLES";

export const verifyUserPermission = (cognitoUserId: string, expectedRole: CognitoRole, actionDescription: string): boolean => {

    if (!isCognitoRoleValid(expectedRole)) {
        throw new Error(`${LOG_PREFIX} [verifyUserPermission] - unknown expected role: ${expectedRole}`);
    }

    const userData = frontendClients.get(cognitoUserId);
    if (!userData) {
        throw new Error(`${LOG_PREFIX} [verifyUserPermission] - user with id ${cognitoUserId} not found`);
    }

    const userRole = userData.twitchData.twitchRole!;
    const cognitoUsername = userData.cognito.cognitoUsername!;

    if (!isCognitoRoleValid(userRole)) {
        throw new Error(`${LOG_PREFIX} [verifyUserPermission] - unknown role: ${userRole} for cognito user: ${cognitoUsername}`);
    }

    const roleHierarchy: Record<CognitoRole, number> = {
        [COGNITO_ROLES.VIEWER]: 0,
        [COGNITO_ROLES.MODERATOR]: 1,
        [COGNITO_ROLES.STREAMER]: 2
    };
    const userRoleLevel = roleHierarchy[userRole];
    const expectedRoleLevel = roleHierarchy[expectedRole];

    const granted = userRoleLevel >= expectedRoleLevel;
    logger.info(`permission ${granted ? '' : 'NOT '}GRANTED for user ${cognitoUsername} with role ${userRole} to perform ${actionDescription}`, LOG_PREFIX, {color: granted ? LogColor.GREEN : LogColor.RED_BRIGHT, style: LogStyle.BOLD})
    return granted
}

export const isCognitoRoleValid = (role: string) => {
    return Object.values(COGNITO_ROLES).includes(role as CognitoRole);
}