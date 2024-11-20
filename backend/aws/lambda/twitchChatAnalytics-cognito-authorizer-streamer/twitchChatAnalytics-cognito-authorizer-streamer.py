import boto3
import jwt
from jwt import PyJWKClient

# AWS Region and Cognito configurations
REGION = "eu-central-1"
USER_POOL_ID = "eu-central-1_IzUkrEEsr"
ROLE_NAME = "Streamer"
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
        print("Token received:", token)

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
        user_in_group = check_user_role_in_db(username, broadcaster_user_login, ROLE_NAME)

        # Generate an IAM policy based on group membership
        if user_in_group:
            return generate_policy("user", "Allow", event["methodArn"])
        else:
            return generate_policy("user", "Deny", event["methodArn"])

    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return generate_policy("user", "Deny", event["methodArn"])
    except jwt.InvalidTokenError:
        print("Invalid token provided")
        return generate_policy("user", "Deny", event["methodArn"])
    except Exception as e:
        print(f"Error during authorization: {str(e)}")
        return generate_policy("user", "Deny", event["methodArn"])


def check_user_role_in_db(cognito_username, broadcaster_user_login, required_role):
    """
    Checks if the specified user with the given Cognito username and Chatter user login has the required role.
    """
    try:
        # Get the table instance
        table = dynamodb.Table(TABLE_NAME)

        # Fetch the user data based on the primary keys
        response = table.get_item(
            Key={
                'CognitoUsername': cognito_username,
                'BroadcasterUserLogin': broadcaster_user_login
            }
        )

        # Check if the record exists in the database
        if 'Item' not in response:
            print(f"User {cognito_username} with Chatter login {broadcaster_user_login} not found in DB")
            return False

        # Check if the user's role matches the required role
        user_role = response['Item'].get('UserRole')
        if user_role == required_role:
            return True
        else:
            print(f"User {cognito_username} with Chatter login {broadcaster_user_login} does not have role {required_role}")
            return False

    except Exception as e:
        # Handle any errors that occur during the process
        print(f"Error in check_user_role_in_db: {str(e)}")
        return False


def generate_policy(principal_id, effect, resource):
    """
    Helper function to generate an IAM policy document.
    """
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
