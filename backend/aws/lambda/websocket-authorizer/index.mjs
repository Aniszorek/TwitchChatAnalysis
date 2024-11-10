import jwt from 'jsonwebtoken';
import axios from 'axios';
import jwkToPem from 'jwk-to-pem';

const region = 'eu-central-1';
const userPoolId = 'eu-central-1_IzUkrEEsr';
const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

let cachedJwks;

async function getJwks() {
  if (!cachedJwks) {
    const response = await axios.get(jwksUrl);
    cachedJwks = response.data.keys;
  }
  return cachedJwks;
}

function generatePolicy(principalId, effect, resource, context = {}) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      }],
    },
    context,
  };
}

export async function handler(event) {
  const token = event.queryStringParameters?.token;
  console.log("Received token:", token);

  if (!token) {
    console.warn("No Authorization token provided.");
    return generatePolicy('user', 'Deny', event.methodArn, {});
  }

  try {
    const jwks = await getJwks();
    const decodedToken = jwt.decode(token, { complete: true });

    if (!decodedToken) {
      console.warn("Invalid JWT token, decoding failed.");
      return generatePolicy('user', 'Deny', event.methodArn, {});
    }

    const jwk = jwks.find(key => key.kid === decodedToken.header.kid);
    if (!jwk) {
      console.error("Public key not found in JWKS for kid:", decodedToken.header.kid);
      return generatePolicy('user', 'Deny', event.methodArn, {});
    }

    const pem = jwkToPem(jwk);
    const verifiedToken = jwt.verify(token, pem, { algorithms: ['RS256'] });
    console.log("Token verification successful:", verifiedToken);

    const context = {
      sub: verifiedToken.sub, // Dodano `sub` do kontekstu
      username: verifiedToken.username,
      issuer: verifiedToken.iss,
      clientId: verifiedToken.client_id,
      tokenUse: verifiedToken.token_use,
      authTime: verifiedToken.auth_time,
      exp: verifiedToken.exp,
      iat: verifiedToken.iat,
      jti: verifiedToken.jti,
    };

    return generatePolicy(verifiedToken.sub, 'Allow', event.methodArn, context);
  } catch (error) {
    console.error("Authorization failed:", error);
    return generatePolicy('user', 'Deny', event.methodArn, {});
  }
}
