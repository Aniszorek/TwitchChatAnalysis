import json
import psycopg2
from psycopg2 import sql
import boto3
import os
from datetime import datetime
from dateutil.parser import parse as parse_datetime
from urllib.parse import unquote

user_name = os.environ['USER_NAME']
password = os.environ['PASSWORD']
rds_host = os.environ['RDS_HOST']
rds_port = os.environ['RDS_PORT']
rds_db_name = os.environ['RDS_DB_NAME']

def insert_data_to_postgresql_db(stream_id, timestamp, metadata):
    conn = psycopg2.connect(
        host=rds_host,
        database=rds_db_name,
        user=user_name,
        password=password,
        port=rds_port
    )
    cur = conn.cursor()
    query = sql.SQL("""
        INSERT INTO stream_metadata (
            stream_id,
            timestamp,
            metadata
        ) VALUES (
            %s, %s, %s
        )
    """)

    cur.execute(query, (
        stream_id,
        timestamp,
        metadata
    ))

    conn.commit()
    cur.close()
    conn.close()

def lambda_handler(event, context):
    for i, record in enumerate(event['Records']):
        try:
            raw_message = record['body']
            decoded_message = unquote(raw_message)
            message_data = json.loads(decoded_message)
            stream_id = message_data['stream_id']
            raw_timestamp = message_data['timestamp']
            try:
                parsed_timestamp = parse_datetime(raw_timestamp)
                print(parsed_timestamp, raw_timestamp)
            except ValueError as e:
                print(f"Failed to parse timestamp: {raw_timestamp} | Error: {e}")
                continue

            metadata = {
                "category": message_data.get('category', "unknown"),
                "viewer_count": message_data.get('viewer_count', 0),
                "follower_count": message_data.get('follower_count', 0),
                "subscriber_count": message_data.get('subscriber_count', 0),
                "message_count": message_data.get('message_count', 0),
                "very_negative_message_count": message_data.get('very_negative_message_count', 0),
                "negative_message_count": message_data.get('negative_message_count', 0),
                "slightly_negative_message_count": message_data.get('slightly_negative_message_count', 0),
                "neutral_message_count": message_data.get('neutral_message_count', 0),
                "slightly_positive_message_count": message_data.get('slightly_positive_message_count', 0),
                "positive_message_count": message_data.get('positive_message_count', 0),
                "very_positive_message_count": message_data.get('very_positive_message_count', 0),


            }

            metadata_json = json.dumps(metadata)
            print(f"stream_id: {stream_id} | Metadata JSON: {metadata_json}")

        except KeyError as e:
            print(f"Missing required field: {e}")
            continue
        except json.JSONDecodeError as e:
            print(f"Failed decoding JSON: {e}")
            continue
        except Exception as e:
            print(f"Failed processing message: {e}")
            continue

        try:
            print("Connecting to database")
            insert_data_to_postgresql_db(stream_id, parsed_timestamp, metadata_json)
            print("Data inserted successfully")
        except Exception as e:
            print(f"Error when connecting to database: {e}")

    return
