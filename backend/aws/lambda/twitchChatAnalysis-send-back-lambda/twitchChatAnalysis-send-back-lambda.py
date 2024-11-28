import boto3
import json
import urllib.parse

API_ID = 'dh50useqij'
STAGE = 'test'
REGION = 'eu-central-1'

dynamodb = boto3.resource('dynamodb')
apigateway_client = boto3.client('apigatewaymanagementapi',
                                 endpoint_url=f'https://{API_ID}.execute-api.{REGION}.amazonaws.com/{STAGE}')

TABLE_NAME = "WebsocketConnections"
MESSAGE_TYPE = 'nlp_processed_message'

def lambda_handler(event, context):
    data = event

    response_data = {
        "type": MESSAGE_TYPE,
        "data": event
    }

    broadcaster_user_login = data.get("broadcaster_user_login")

    print(data)

    if not broadcaster_user_login:
        raise ValueError("Error: broadcaster_user_login is missing in the input data.")

    table = dynamodb.Table(TABLE_NAME)
    try:
        response = table.get_item(Key={"streamer_name": broadcaster_user_login})
    except Exception as e:
        raise RuntimeError(f"Error accessing DynamoDB: {e}")

    if "Item" not in response:
        raise ValueError(f"No active connections found for broadcaster_user_login: {broadcaster_user_login}")

    connection_ids = response["Item"].get("connection_ids", [])

    if not connection_ids:
        raise ValueError(f"No connection_ids found for broadcaster_user_login: {broadcaster_user_login}")

    errors = []
    for connection_id in connection_ids:
        try:
            clean_connection_id = urllib.parse.unquote(connection_id)
            apigateway_client.post_to_connection(
                ConnectionId=clean_connection_id,
                Data=json.dumps(response_data)
            )
            print(f"Message sent to connection_id: {connection_id}")
        except Exception as e:
            print(f"Error sending message to connection_id {connection_id}: {e}")
            errors.append({"connection_id": connection_id, "error": str(e)})

    if errors:
        raise Exception(f"Errors occurred while sending messages: {errors}")
