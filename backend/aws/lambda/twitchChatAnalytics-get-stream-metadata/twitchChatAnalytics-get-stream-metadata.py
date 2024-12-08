import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

DB_HOST = os.environ['RDS_HOST']
DB_PORT = os.environ.get('RDS_PORT')
DB_NAME = os.environ['RDS_DB_NAME']
DB_USER = os.environ['USER_NAME']
DB_PASSWORD = os.environ['PASSWORD']

def custom_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def query_stream_metadata(stream_id, broadcaster_username):
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = """
        SELECT sm.stream_id, sm.timestamp, sm.metadata
        FROM stream_metadata sm
        JOIN streams s ON sm.stream_id = s.stream_id
        WHERE sm.stream_id = %s AND s.broadcaster_username = %s
        """

        cursor.execute(query, (stream_id, broadcaster_username,))
        results = cursor.fetchall()

        cursor.close()
        conn.close()

        return results

    except Exception as e:
        print(f"Error querying the database: {e}")
        raise

def lambda_handler(event, context):
    try:
        stream_id = event.get('queryStringParameters', {}).get('stream_id')

        if not stream_id:
            return {
                "statusCode": 400,
                "body": "stream_id is required"
            }

        headers = event.get('headers') or {}
        broadcaster_username = headers.get('BroadcasterUserLogin')

        if not broadcaster_username:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "BroadcasterUserLogin header is required"})
            }

        data = query_stream_metadata(stream_id, broadcaster_username)
        response_body = json.dumps(data, default=custom_serializer)
        status = 200 if len(list(data)) > 0 else 204

        return {
            "statusCode": status,
            "body": response_body
        }
    except Exception as e:
        print(f"Error in lambda_handler: {e}")
        return {
            "statusCode": 500,
            "body": "Internal server error"
        }
