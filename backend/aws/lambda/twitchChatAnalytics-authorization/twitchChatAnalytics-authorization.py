import boto3
import requests
import time
from botocore.exceptions import ClientError

# Configuration
USER_POOL_ID = 'eu-central-1_IzUkrEEsr'
TABLE_NAME = 'UserRoles'
cognito_client = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """
    Lambda handler to validate OAuth token, check user role, and assign the user to the appropriate Cognito group.
    """
    try:
        # Extract required parameters from the event
        token = event.get('oauth_token')
        cognito_username = event.get('cognito_username')
        broadcaster_user_login = event.get('broadcaster_user_login')
        client_id = event.get('client_id')

        # Validate inputs
        if not all([token, cognito_username, broadcaster_user_login, client_id]):
            return {'statusCode': 400, 'body': 'Missing required parameters'}

        # Verify OAuth token
        twitch_data = verify_oauth_token(token, client_id)

        if twitch_data is None:
            return {'statusCode': 400, 'body': 'Invalid OAuth token'}
        user_id = twitch_data['id']

        # Get broadcaster data
        broadcaster_data = get_broadcaster_data(token, broadcaster_user_login, client_id)
        if not broadcaster_data:
            return {'statusCode': 404, 'body': 'Broadcaster not found'}

        broadcaster_id = broadcaster_data['id']
        broadcaster_login = broadcaster_data['login']

        # Determine the user's role
        if user_id == broadcaster_id:
            role = 'Streamer'
        else:
            is_moderator = verify_if_moderator(token, user_id, broadcaster_id, client_id)
            role = 'Moderator' if is_moderator else 'Viewer'

        add_user_result = add_user_info_to_db(cognito_username, broadcaster_login, role)

        if add_user_result:
            return {'statusCode': 200, 'body': f'User successfully added to {role} group'}
        else:
            return {'statusCode': 500, 'body': 'Failed to update user group'}

    except Exception as e:
        print(f"Error in handler: {str(e)}")
        return {'statusCode': 500, 'body': f'Internal server error: {str(e)}'}

def add_user_info_to_db(cognito_username, broadcaster_login, role):
    """
    Adds or updates user information to a DynamoDB table.
    If the user does not exist, a new record is created.
    """
    try:
        table = dynamodb.Table(TABLE_NAME)

        # Check if the user exists
        response = table.get_item(
            Key={
                'CognitoUsername': cognito_username,
                'BroadcasterUserLogin': broadcaster_login
            }
        )

        if 'Item' in response:
            # User exists, update the role
            table.update_item(
                Key={
                    'CognitoUsername': cognito_username,
                    'BroadcasterUserLogin': broadcaster_login
                },
                UpdateExpression="SET UserRole = :role",
                ExpressionAttributeValues={
                    ':role': role
                },
                ReturnValues="UPDATED_NEW"
            )
            print(f"Updated user {cognito_username} with role {role}")
        else:
            # User does not exist, create a new record
            table.put_item(
                Item={
                    'CognitoUsername': cognito_username,
                    'BroadcasterUserLogin': broadcaster_login,
                    'UserRole': role
                }
            )
            print(f"Added new user {cognito_username} with role {role}")

        return True

    except ClientError as e:
        print(f"Error in add_user_info_to_db: {str(e)}")
        return False


def verify_oauth_token(token, client_id):
    """
    Verifies the OAuth token using Twitch's API.
    """
    try:
        response = requests.get(
            'https://api.twitch.tv/helix/users',
            headers={'Authorization': f'Bearer {token}', 'Client-Id': client_id}
        )
        if response.status_code != 200:
            print("OAuth token verification failed with status code:", response.status_code)
            return None

        data = response.json()
        return data['data'][0] if 'data' in data and data['data'] else None
    except Exception as e:
        print(f"Error in verify_oauth_token: {str(e)}")
        return None

def get_broadcaster_data(token, broadcaster_user_login, client_id):
    """
    Retrieves broadcaster data by login name using Twitch's API.
    """
    try:
        response = requests.get(
            f'https://api.twitch.tv/helix/users?login={broadcaster_user_login}',
            headers={'Authorization': f'Bearer {token}', 'Client-Id': client_id}
        )
        if response.status_code != 200:
            print("Broadcaster data retrieval failed with status code:", response.status_code)
            return None

        data = response.json()
        return data['data'][0] if 'data' in data and data['data'] else None
    except Exception as e:
        print(f"Error in get_broadcaster_data: {str(e)}")
        return None

def verify_if_moderator(token, user_id, broadcaster_id, client_id):
    """
    Checks if the user is a moderator for a given broadcaster.
    """
    try:
        response = requests.get(
            f'https://api.twitch.tv/helix/moderation/channels?user_id={user_id}',
            headers={'Authorization': f'Bearer {token}', 'Client-Id': client_id}
        )
        if response.status_code == 200:
            data = response.json()
            return any(channel['broadcaster_id'] == broadcaster_id for channel in data['data'])
        else:
            print(f"Moderator check failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error in verify_if_moderator: {str(e)}")
        return False