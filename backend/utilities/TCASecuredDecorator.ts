import express from 'express';
import {extractHeaders, extractQueryParams} from "./utilities";
import {verifyToken} from "../aws/cognitoAuth";
import {LogColor, logger, LogStyle} from "./logger";
import {CognitoRole} from "./CognitoRoleEnum";
import {verifyUserPermission} from "./cognitoRoles";

const LOG_PREFIX = "TCA SECURED"

export function TCASecured<TQueryParams extends Record<string, string | undefined> = {}, THeaders extends Record<string, string | undefined> = {}>({
                                                                                                                                                       requiredQueryParams,
                                                                                                                                                       optionalQueryParams,
                                                                                                                                                       requiredHeaders,
                                                                                                                                                       bodyValidationFn,
                                                                                                                                                       requiredRole,
                                                                                                                                                       actionDescription,
                                                                                                                                                       skipAuthorization
                                                                                                                                                   }: {
    requiredQueryParams?: (keyof TQueryParams)[];
    optionalQueryParams?: (keyof TQueryParams)[];
    requiredHeaders?: (keyof THeaders)[];
    bodyValidationFn?: (body: any) => boolean;
    requiredRole?: CognitoRole;
    skipAuthorization?: boolean;
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

                let _optionalQueryParams: Partial<TQueryParams> = {};
                if (optionalQueryParams) {
                    _optionalQueryParams = extractQueryParams<TQueryParams>(req, optionalQueryParams, false);
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

                if(!skipAuthorization && requiredRole)
                {
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
                            optionalQueryParams: _optionalQueryParams,
                            headers,
                            validatedBody,
                            cognitoUserId
                        }
                    ]);
                }
                else if (!skipAuthorization && !requiredRole) {
                    throw new Error(`If skipAuthorization is set to false, you must provide CognitoRole!`);
                }

                // return unauthorized
                logger.info(`got access without authorization: ${actionDescription}`, LOG_PREFIX, {color: LogColor.GREEN, style: LogStyle.BOLD})
                return originalHandler.apply(this, [
                    req,
                    res,
                    next,
                    {
                        queryParams,
                        _optionalQueryParams,
                        headers,
                        validatedBody,
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
