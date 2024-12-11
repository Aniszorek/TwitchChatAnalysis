import json
import psycopg2
from psycopg2 import sql
import boto3
import os
from datetime import datetime
from dateutil.parser import parse as parse_datetime
from decimal import Decimal
import urllib.parse

user_name = os.environ['USER_NAME']
password = os.environ['PASSWORD']
rds_host = os.environ['RDS_HOST']
rds_port = os.environ['RDS_PORT']
rds_db_name = os.environ['RDS_DB_NAME']


def fetch_messages_from_postgresql_db(broadcaster_user_login,
                                      stream_id=None,
                                      chatter_user_login=None,
                                      start_time=None,
                                      end_time=None):
    conn = psycopg2.connect(
        host=rds_host,
        database=rds_db_name,
        user=user_name,
        password=password,
        port=rds_port
    )
    cur = conn.cursor()

    query = """
        SELECT
            stream_id,
            broadcaster_user_login,
            chatter_user_login,
            message_text,
            nlp_classification,
            timestamp
        FROM messages
        WHERE broadcaster_user_login = %s
    """
    query_params = [broadcaster_user_login]

    if stream_id:
        query += " AND stream_id = %s"
        query_params.append(stream_id)

    if chatter_user_login:
        query += " AND chatter_user_login = %s"
        query_params.append(chatter_user_login)

    if start_time:
        query += " AND timestamp >= %s"
        query_params.append(start_time)

    if end_time:
        query += " AND timestamp <= %s"
        query_params.append(end_time)

    cur.execute(query, tuple(query_params))
    rows = cur.fetchall()

    result = [
        {
            "stream_id": row[0],
            "broadcaster_user_login": row[1],
            "chatter_user_login": row[2],
            "message_text": row[3],
            "nlp_classification": row[4],
            "timestamp": row[5].isoformat() if row[5] else None
        }
        for row in rows
    ]

    cur.close()
    conn.close()
    return result


def lambda_handler(event, context):
    try:
        print(event)

        headers = event.get('headers') or {}
        broadcaster_user_login = headers.get('BroadcasterUserLogin')

        if not broadcaster_user_login:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "BroadcasterUserLogin header is required"})
            }

        query_params = event.get('queryStringParameters') or {}
        stream_id = query_params.get('stream_id', None)
        chatter_user_login = query_params.get('chatter_user_login', None)
        start_time = query_params.get('start_time', None)
        end_time = query_params.get('end_time', None)

        parsed_start_time = parse_datetime(start_time) if start_time else None
        parsed_end_time = parse_datetime(end_time) if end_time else None
        print(f"Parsed start_time: {parsed_start_time}")

        messages = fetch_messages_from_postgresql_db(
            broadcaster_user_login=broadcaster_user_login,
            stream_id=stream_id,
            chatter_user_login=chatter_user_login,
            start_time=parsed_start_time,
            end_time=parsed_end_time
        )

        return {
            "statusCode": 200 if len(messages) > 0 else 204,
            "body": json.dumps(messages)
        }
    except Exception as e:
        print(f"Error occurred: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": f"Error occurred: {e}"})
        }
