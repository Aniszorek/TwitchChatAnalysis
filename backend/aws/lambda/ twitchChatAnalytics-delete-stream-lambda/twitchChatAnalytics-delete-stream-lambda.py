import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

DB_HOST = os.environ['RDS_HOST']
DB_PORT = os.environ.get('RDS_PORT')
DB_NAME = os.environ['RDS_DB_NAME']
DB_USER = os.environ['USER_NAME']
DB_PASSWORD = os.environ['PASSWORD']

def delete_stream_and_metadata(stream_id, broadcaster_username):
    try:
        with psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
        ) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                query_streams = """
                DELETE FROM streams
                WHERE stream_id = %s AND broadcaster_username = %s
                """
                cursor.execute(query_streams, (stream_id, broadcaster_username))
                streams_deleted = cursor.rowcount

                if streams_deleted == 0:
                    return {
                        "streams_deleted": 0,
                        "metadata_deleted": 0
                    }

                query_metadata = """
                DELETE FROM stream_metadata
                WHERE stream_id = %s
                """
                cursor.execute(query_metadata, (stream_id,))
                metadata_deleted = cursor.rowcount

                conn.commit()

                return {
                    "streams_deleted": streams_deleted,
                    "metadata_deleted": metadata_deleted
                }
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

        if not stream_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "stream_id parameter is required"})
            }

        result = delete_stream_and_metadata(stream_id, broadcaster_username)

        if result["streams_deleted"] == 0:
            return {
                "statusCode": 404,
                "body": json.dumps({"message": f"stream with id {stream_id} not found"})
            }

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Data deleted",
                "details": result
            })
        }
    except Exception as e:
        print(f"Error in lambda_handler: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal server error"})
        }
