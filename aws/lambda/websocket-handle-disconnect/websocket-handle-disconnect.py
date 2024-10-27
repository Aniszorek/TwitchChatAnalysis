import boto3
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('WebsocketConnections')

def lambda_handler(event, context):
    connection_id = event['requestContext']['connectionId']
    response = table.scan()
    for item in response['Items']:
        if connection_id in item['connection_ids']:
            updated_list = [id for id in item['connection_ids'] if id != connection_id]
            table.update_item(
                Key={'streamer_name': item['streamer_name']},
                UpdateExpression="SET connection_ids = :new_list",
                ExpressionAttributeValues={':new_list': updated_list}
            )
    return {"statusCode": 200}
