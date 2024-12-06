import boto3
import jwt
from jwt import PyJWKClient

# AWS Region and Cognito configurations
REGION = "eu-central-1"
USER_POOL_ID = "eu-central-1_IzUkrEEsr"
JWK_URL = f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json"
TABLE_NAME = 'UserRoles'

cognito_client = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event, context):
    """
    AWS Lambda handler to authenticate a user based on Cognito JWT token
    and check if they have specific role.
    """
    try:
        # Extract JWT token from the Authorization header
        token = event['headers']['Authorization'].split(" ")[1]
        broadcaster_user_login = event['headers']['BroadcasterUserLogin']
        method_arn = event["methodArn"]
        api_gateway_arn = get_api_gateway_arn(method_arn)
        print(event)

        # Retrieve the signing key from JWK URL
        jwk_client = PyJWKClient(JWK_URL)
        signing_key = jwk_client.get_signing_key_from_jwt(token)

        # Decode the JWT token to get user details
        decoded_token = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}",
            options={"verify_aud": False}
        )
        username = decoded_token.get("cognito:username")
        if not username:
            raise ValueError("Username not found in token")

        print("Decoded username:", username)

        # Check if the user is in the specified Cognito group
        user_role = get_user_role_from_db(username, broadcaster_user_login)

        # Check role and generate policy accordingly
        if user_role == "Streamer":
            # Streamers have access to all endpoints
            return generate_policy("user", "Allow", api_gateway_arn)
        elif user_role == "Moderator":
            # Moderators have access only to GET methods
            api_gateway_arn = get_api_gateway_arn_for_moderator(method_arn)
            return generate_policy("user", "Allow", api_gateway_arn)
        else:
            # Deny access for other roles
            return generate_policy("user", "Deny", api_gateway_arn)

    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return generate_policy("user", "Deny", api_gateway_arn)
    except jwt.InvalidTokenError:
        print("Invalid token provided")
        return generate_policy("user", "Deny", api_gateway_arn)
    except Exception as e:
        print(f"Error during authorization: {str(e)}")
        return generate_policy("user", "Deny", api_gateway_arn)

def get_api_gateway_arn(method_arn, resource_path="*"):
    """
    Extracts and constructs a generalized API Gateway ARN from the given methodArn.
    """
    arn_parts = method_arn.split("/")

    # Reconstruct the ARN with a wildcard for resource paths
    api_gateway_arn = f"{arn_parts[0]}/{arn_parts[1]}/{resource_path}"

    return api_gateway_arn

def get_api_gateway_arn_for_moderator(method_arn, resource_path="GET/*"):
    """
    Extracts and constructs a generalized API Gateway ARN for moderators with only GET access.
    """
    arn_parts = method_arn.split("/")
    # Moderator has access only to GET methods
    api_gateway_arn = f"{arn_parts[0]}/{arn_parts[1]}/{resource_path}"
    return api_gateway_arn

def get_user_role_from_db(cognito_username, broadcaster_user_login):
    """
    Retrieves the user's role from DynamoDB.
    """
    try:
        table = dynamodb.Table(TABLE_NAME)
        response = table.get_item(
            Key={
                'CognitoUsername': cognito_username,
                'BroadcasterUserLogin': broadcaster_user_login
            }
        )

        if 'Item' not in response:
            print(f"User {cognito_username} not found in DB")
            return None

        return response['Item'].get('UserRole')

    except Exception as e:
        print(f"Error fetching user role from DB: {str(e)}")
        return None


def generate_policy(principal_id, effect, resource):
    """
    Helper function to generate an IAM policy document.
    """
    print(f"Generating policy with resource: {resource} and effect: {effect}")
    if effect and resource:
        return {
            "principalId": principal_id,
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": effect,
                        "Resource": resource
                    }
                ]
            }
        }
    else:
        raise ValueError("Effect and resource are required for policy generation")