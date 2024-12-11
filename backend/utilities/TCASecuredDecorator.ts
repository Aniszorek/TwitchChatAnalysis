import express from 'express';
import {CognitoRole, verifyUserPermission} from "../cognitoRoles";
import {extractHeaders, extractQueryParams} from "./utilities";
import {verifyToken} from "../aws/cognitoAuth";
import {LogColor, logger, LogStyle} from "./logger";

const LOG_PREFIX = "TCA SECURED"

export function TCASecured<TQueryParams extends Record<string, string | undefined> = {}, THeaders extends Record<string, string | undefined> = {}>({
                                                                                                                                                       requiredQueryParams,
                                                                                                                                                       requiredHeaders,
                                                                                                                                                       bodyValidationFn,
                                                                                                                                                       requiredRole,
                                                                                                                                                       actionDescription
                                                                                                                                                   }: {
    requiredQueryParams?: (keyof TQueryParams)[];
    requiredHeaders?: (keyof THeaders)[];
    bodyValidationFn?: (body: any) => boolean;
    requiredRole: CognitoRole;
    actionDescription: string;
}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalHandler = descriptor.value;

        descriptor.value = async function (req: express.Request, res: express.Response, next: express.NextFunction) {
            try {
                let queryParams: Partial<TQueryParams> = {};
                if (requiredQueryParams) {
                    queryParams = extractQueryParams<TQueryParams>(req, requiredQueryParams);
                }

                let headers: Partial<THeaders> = {};
                if (requiredHeaders) {
                    headers = extractHeaders<THeaders>(req, requiredHeaders);
                }

                let validatedBody = null;
                if (bodyValidationFn) {
                    const body = req.body;
                    if (!bodyValidationFn(body)) {
                        throw new Error('Invalid request body');
                    }
                    validatedBody = body;
                }

                const authHeader = req.headers['authorization'];
                if (!authHeader) {
                    throw new Error('Authorization header is required');
                }

                const token = authHeader.split(' ')[1]; // Assuming Bearer token
                if (!token) {
                    throw new Error('Invalid Authorization header format');
                }

                const cognitoUserId = (await verifyToken(token)).sub;
                if(!cognitoUserId) {
                    throw new Error('bad cognitoIdToken');
                }

                if (!verifyUserPermission(cognitoUserId, requiredRole, actionDescription)) {
                    throw new Error(`User does not have required role: ${requiredRole}`);
                }

                return originalHandler.apply(this, [
                    req,
                    res,
                    next,
                    {
                        queryParams,
                        headers,
                        validatedBody
                    }
                ]);
            } catch (error:any) {
                logger.error(`Error in ${propertyKey}: ${error.message}`, LOG_PREFIX, {color: LogColor.RED_BRIGHT, style: LogStyle.BOLD});
                res.status(400).json({
                    error: error.message || 'An unexpected error occurred'
                });
            }
        };

        return descriptor;
    };
}
