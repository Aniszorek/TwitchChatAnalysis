import json
from google.cloud import language_v1
from google.oauth2 import service_account
import boto3
import os
import requests
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

CREDENTIALS_FILE = "credentials.json"

lambda_client = boto3.client('lambda')
lambda_send_back_name = 'twitchChatAnalytics-send-back-lambda'
api_gateway_url = "https://t7pqmsv4x4.execute-api.eu-central-1.amazonaws.com/test/twitchChatAnalytics-messages-add-to-rds"

def analyze(text, credentials_file):

    credentials = service_account.Credentials.from_service_account_file(credentials_file)
    client = language_v1.LanguageServiceClient(credentials=credentials)

    document = language_v1.Document(
        content=text, type_=language_v1.Document.Type.PLAIN_TEXT
    )

    annotations = client.analyze_sentiment(request={"document": document})

    return annotations


def sign_request(url, data, region="eu-central-1", method="POST"):
    """Sign an API Gateway request using AWS SigV4"""
    session = boto3.session.Session()
    credentials = session.get_credentials()

    request = AWSRequest(
        method=method,
        url=url,
        data=data,
        headers={"Content-Type": "application/json"}
    )

    SigV4Auth(credentials, "execute-api", region).add_auth(request)

    return dict(request.headers)


def classify_sentiment(score, magnitude):
    rules = [
        (score < -0.8, "Very Negative"),
        (score < -0.6 and magnitude > 2, "Very Negative"),
        (score < -0.4 and magnitude > 4, "Very Negative"),
        (score < -0.6, "Negative"),
        (score < -0.4 and magnitude > 2, "Negative"),
        (score < -0.2 and magnitude > 4, "Negative"),
        (score < -0.3, "Slightly Negative"),
        (score < -0.1 and magnitude > 2, "Slightly Negative"),
        (score < 0.1 and magnitude > 4, "Slightly Negative"),
        (score < 0.3, "Neutral"),
        (score < 0.5, "Slightly Positive"),
        (score < 0.7, "Positive"),
    ]

    for condition, label in rules:
        if condition:
            return label
    return "Very Positive"


def lambda_handler(event, context):
    results = []

    for i, record in enumerate(event['Records']):

        try:
            message = record['body']
            message_data = json.loads(message)
            print("Processing message:", i, message_data)

            stream_id = message_data['stream_id']
            broadcaster_user_login = message_data['broadcaster_user_login']
            chatter_user_login = message_data['chatter_user_login']
            message_text = message_data['message_text']
            timestamp = message_data['timestamp']
            message_id = message_data['message_id']

        except Exception as e:
            print(f"Failed reading json: {str(e)}")
            continue


        try:
            print(f"Sentiment Analysis: {message_text}", i)
            annotations = analyze(message_text, CREDENTIALS_FILE)
            sentiment_score = annotations.document_sentiment.score
            magnitude_score = annotations.document_sentiment.magnitude
            nlp_classification = classify_sentiment(sentiment_score, magnitude_score)

        except Exception as e:
            print(f"Error with NLP API {str(e)}")
            continue


        result = {
            "stream_id": stream_id,
            "broadcaster_user_login": broadcaster_user_login,
            "chatter_user_login": chatter_user_login,
            "message_text": message_text,
            "timestamp": timestamp,
            "nlp_classification": nlp_classification
        }

        try:
            print("Signing request and inserting data into RDS...")
            signed_headers = sign_request(api_gateway_url, json.dumps(result))
            response = requests.post(api_gateway_url, headers=signed_headers, json=result)

            if response.status_code == 200:
                print("Successfully inserted data into RDS.")
            else:
                print(f"Failed to insert data. Status code: {response.status_code}")
                results.append({
                    'statusCode': response.status_code,
                    'body': f"Failed to insert data: {response.text}"
                })
                continue

        except Exception as e:
            print(f"Failed inserting data to RDS - {str(e)}")
            continue

        try:
            result['message_id'] = message_id
            print(f"Starting {lambda_send_back_name}")
            response = lambda_client.invoke(
                FunctionName=lambda_send_back_name,
                InvocationType="Event",
                Payload=json.dumps(result)
            )

        except Exception as e:
            print(f"Failed starting: {lambda_send_back_name} - {str(e)}")

        results.append(result)

    return {
        "statusCode": 200,
        "body": json.dumps(results)
    }
