import {frontendClients} from "./bot/wsServer.js";

export const COGNITO_ROLES = {
    STREAMER: "Streamer",
    MODERATOR: "Moderator",
    VIEWER: "Viewer"
};

const LOG_PREFIX = "COGNITO_ROLES: ";

export const verifyUserPermission = (cognitoUserId, expectedRole, actionDescription) => {

    if(!isCognitoRoleValid(expectedRole)) {
        throw new Error(`${LOG_PREFIX} [verifyUserPermission] - unknown expected role: ${expectedRole}`)
    }

    const userRole = frontendClients.get(cognitoUserId).twitchData.twitchRole;
    const cognitoUsername = frontendClients.get(cognitoUserId).cognito.cognitoUsername;

    if(!isCognitoRoleValid(userRole)) {
        throw new Error(`${LOG_PREFIX} [verifyUserPermission] - unknown role: ${userRole} for cognito user: ${cognitoUsername}`)
    }

    const roleHierarchy = {[COGNITO_ROLES.VIEWER]: 0, [COGNITO_ROLES.MODERATOR]: 1, [COGNITO_ROLES.STREAMER]: 2};
    const userRoleLevel = roleHierarchy[userRole]
    const expectedRoleLevel = roleHierarchy[expectedRole]

    const granted = userRoleLevel >= expectedRoleLevel
    console.log(`${LOG_PREFIX} [verifyUserPermission] - permission ${granted ? '' : 'NOT '}GRANTED for user ${cognitoUsername} with role ${userRole} to perform ${actionDescription}`)

    return granted
}

export const isCognitoRoleValid = (role) => {
    return Object.values(COGNITO_ROLES).includes(role)
}