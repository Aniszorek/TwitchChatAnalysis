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

def query_stream_metadata_by_stream_id(stream_id, broadcaster_username):
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
        SELECT * 
        FROM streams
        WHERE stream_id = %s
        AND broadcaster_username = %s
        """

        cursor.execute(query, (stream_id, broadcaster_username,))
        results = cursor.fetchall()

        cursor.close()
        conn.close()

        return results

    except Exception as e:
        print(f"Error querying the database: {e}")
        raise

def query_streams_by_broadcaster_username(broadcaster_username):
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
        SELECT * 
        FROM streams
        WHERE broadcaster_username = %s
        """

        cursor.execute(query, (broadcaster_username,))
        results = cursor.fetchall()

        cursor.close()
        conn.close()

        return results

    except Exception as e:
        print(f"Error querying the database: {e}")
        raise

def lambda_handler(event, context):
    try:
        if not event:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Invalid event object"})
            }

        query_params = event.get('queryStringParameters') or {}
        stream_id = query_params.get('stream_id')

        headers = event.get('headers') or {}
        broadcaster_username = headers.get('BroadcasterUserLogin')

        if not broadcaster_username:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "BroadcasterUserLogin header is required"})
            }

        if stream_id:
            data = query_stream_metadata_by_stream_id(stream_id, broadcaster_username)
        else:
            data = query_streams_by_broadcaster_username(broadcaster_username)

        response_body = json.dumps(data, default=custom_serializer)

        return {
            "statusCode": 200 if len(data) > 0 else 204,
            "body": response_body
        }
    except Exception as e:
        print(f"Error in lambda_handler: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal server error"})
        }
