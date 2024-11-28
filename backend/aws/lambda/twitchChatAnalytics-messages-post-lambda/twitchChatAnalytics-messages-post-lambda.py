import json
from google.cloud import language_v1
from google.oauth2 import service_account
import psycopg2
import boto3
from psycopg2 import sql
import os

CREDENTIALS_FILE = "credentials.json"

user_name = os.environ['USER_NAME']
password = os.environ['PASSWORD']
rds_host = os.environ['RDS_HOST']
rds_port = os.environ['RDS_PORT']
rds_db_name = os.environ['RDS_DB_NAME']

lambda_client = boto3.client('lambda')
lambda_send_back_name = 'twitchChatAnalytics-send-back-lambda'

def insert_data_to_postgresql_db(stream_id, broadcaster_user_login, chatter_user_login, message_text, sentiment_score, magnitude_score, timestamp):

    # Init database connection
    conn = psycopg2.connect(
        host =      rds_host,
        database =  rds_db_name,
        user =      user_name,
        password =  password,
        port =      rds_port
    )

    cur = conn.cursor()

    # prepare query
    query = sql.SQL("""
            INSERT INTO messages (
                stream_id,
                broadcaster_user_login,
                chatter_user_login,
                message_text,
                sentiment_score,
                magnitude_score,
                timestamp
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s
            )
        """)

    # execute query
    cur.execute(query, (
        stream_id,
        broadcaster_user_login,
        chatter_user_login,
        message_text,
        sentiment_score,
        magnitude_score,
        timestamp
    ))

    conn.commit()

    # close db connection
    cur.close()
    conn.close()

def analyze(text, credentials_file):

    # initialize credentials
    print("Credentials initialization")
    credentials = service_account.Credentials.from_service_account_file(credentials_file)

    # send credentials to Google
    client = language_v1.LanguageServiceClient(credentials=credentials)

    document = language_v1.Document(
        content=text, type_=language_v1.Document.Type.PLAIN_TEXT
    )
    print(f"Starting analysis for: {document}")
    annotations = client.analyze_sentiment(request={"document": document})
    print("End of analysis")
    return annotations

def lambda_handler(event, context):

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
        except:
            print("Failed reading json")
            continue

        try:
            print(f"Sentiment Analysis: {message_text}",i)
            annotations = analyze(message_text, CREDENTIALS_FILE)
            sentiment_score = annotations.document_sentiment.score
            magnitude_score = annotations.document_sentiment.magnitude
        except:
            print("Error with NLP API")
            continue

        # TODO: uncomment when database is ready
        # try:
        #     print("Connecting to database")
        #
        #     insert_data_to_postgresql_db(stream_id, broadcaster_user_login, chatter_user_login, message_text, sentiment_score, magnitude_score, timestamp)
        # except:
        #     print("Error when connecting to database")

        result = {
            "stream_id": stream_id,
            "broadcaster_user_login": broadcaster_user_login,
            "chatter_user_login": chatter_user_login,
            "message_text": message_text,
            "sentiment_score": sentiment_score,
            "magnitude_score": magnitude_score,
            "timestamp": timestamp
        }

        try:
            response = lambda_client.invoke(
                FunctionName=lambda_send_back_name,
                InvocationType="Event",
                Payload=json.dumps(result)
            )
            print(f"Starting {lambda_send_back_name}")
        except:
            print(f"Failed starting: {lambda_send_back_name}")

        return result

