import json

def lambda_handler(event, context):

    try:
        broadcaster_user_login = event['broadcaster_user_login']
        chatter_user_login = event['chatter_user_login']
        message_text = event['message_text']

        print(f"Broadcaster: {broadcaster_user_login}")
        print(f"Chatter: {chatter_user_login}")
        print(f"Message: {message_text}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data received successfully',
                'received': {
                    'broadcaster_user_login': broadcaster_user_login,
                    'chatter_user_login': chatter_user_login,
                    'message_text': message_text
                }
            })
        }

    except KeyError as e:
        print(f"Missing key in event: {str(e)}")
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Missing key: {str(e)}'})
        }