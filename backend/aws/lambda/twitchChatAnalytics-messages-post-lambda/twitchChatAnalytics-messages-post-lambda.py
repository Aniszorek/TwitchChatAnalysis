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

    #Inicjacja połaczenia z bazą
    conn = psycopg2.connect(
        host =      rds_host,
        database =  rds_db_name,
        user =      user_name,
        password =  password,
        port =      rds_port
    )

    cur = conn.cursor()

    #Struktura zapytania do bazy
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

    #Wykonanie zapytania
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

    #Zamknięcie połączenia z bazą
    cur.close()
    conn.close()

def analyze(text, credentials_file):

    # Inicjalizacja poświadczeń
    print("Inicjalizacja poświadczeń")
    credentials = service_account.Credentials.from_service_account_file(credentials_file)

    # Przekazywanie poświadczeń do klienta
    client = language_v1.LanguageServiceClient(credentials=credentials)

    document = language_v1.Document(
        content=text, type_=language_v1.Document.Type.PLAIN_TEXT
    )
    print(f"analiza {document}")
    annotations = client.analyze_sentiment(request={"document": document})
    print("koniec analizy")
    return annotations

def lambda_handler(event, context):

    for i, record in enumerate(event['Records']):
        try:
            message = record['body']  # Pobranie całego JSON z wiadomości
            message_data = json.loads(message)  # Załadowanie jako słownik
            print("Przetwarzanie wiadomości:", i, message_data)
            # Pobieranie pól z wiadomości
            stream_id = message_data['stream_id']
            broadcaster_user_login = message_data['broadcaster_user_login']
            chatter_user_login = message_data['chatter_user_login']
            message_text = message_data['message_text']
            timestamp = message_data['timestamp']
        except:
            print("Lambda nie przetworzyła jsona")
            continue

        try:
            print(f"Analiza sentymentu: {message_text}",i)
            #Analiza sentymentu dla message_text
            annotations = analyze(message_text, CREDENTIALS_FILE)
            sentiment_score = annotations.document_sentiment.score
            magnitude_score = annotations.document_sentiment.magnitude
        except:
            print("Problem z NLP API")
            continue

        # TODO: uncomment when database is ready
        # try:
        #     print("Łączenie z bazą")
        #     #Umieszczenie danych w bazie
        #     insert_data_to_postgresql_db(stream_id, broadcaster_user_login, chatter_user_login, message_text, sentiment_score, magnitude_score, timestamp)
        # except:
        #     print("Problem z połączeniem z bazą")

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
            print(f"Uruchamiam {lambda_send_back_name}")
        except:
            print(f"Nie udalo sie uruchomic {lambda_send_back_name}")

        return result

