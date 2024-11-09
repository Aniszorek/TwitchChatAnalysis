import json
import boto3

def lambda_handler(event, context):
    print(f'Received event: {event}')

    if 'requestContext' in event and 'body' in event:
        connection_id = event['requestContext']['connectionId']
        body = json.loads(event['body'])

        if body.get('action') == 'ping':
            print('Ping received, sending pong back')

            domain_name = event['requestContext']['domainName']
            stage = event['requestContext']['stage']
            apigw_management_api = boto3.client(
                'apigatewaymanagementapi',
                endpoint_url=f"https://{domain_name}/{stage}"
            )

            try:
                apigw_management_api.post_to_connection(
                    ConnectionId=connection_id,
                    Data=json.dumps({"action": "pong"})
                )
            except Exception as e:
                print(f"Error sending pong: {e}")

    return {
        'statusCode': 200,
        'body': json.dumps({"message": "Ping request received"})
    }
