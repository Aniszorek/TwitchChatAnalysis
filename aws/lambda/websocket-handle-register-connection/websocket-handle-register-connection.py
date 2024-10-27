import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('WebsocketConnections')

expected_action = 'registerConnection'
required_fields = ['action', 'streamer_name']


def lambda_handler(event, context):
    connection_id = event['requestContext']['connectionId']
    body = json.loads(event['body'])

    if body.get('action') != expected_action:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid request body: action is missing or incorrect'})
        }

    if not all(field in body for field in required_fields):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid request body: required fields are missing'})
        }

    for key in body.keys():
        if key not in required_fields:
            print(f"additional field: {key}")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Invalid request body: unexpected field "{key}"'})
            }

    streamer_name = body.get('streamer_name')

    if not streamer_name:
        return {"statusCode": 400, "body": "streamer_name is required"}

    table.update_item(
        Key={'streamer_name': streamer_name},
        UpdateExpression="SET connection_ids = list_append(if_not_exists(connection_ids, :empty_list), :new_conn)",
        ExpressionAttributeValues={
            ':new_conn': [connection_id],
            ':empty_list': []
        }
    )

    return {"statusCode": 200, "body": "Connection registered"}
