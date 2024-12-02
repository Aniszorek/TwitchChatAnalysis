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

def insert_data_to_postgresql_db(stream_id,
                                 broadcaster_username,
                                 stream_title,
                                 started_at,
                                 ended_at,
                                 start_follows,
                                 end_follows,
                                 start_subs,
                                 end_subs):
    conn = psycopg2.connect(
        host=rds_host,
        database=rds_db_name,
        user=user_name,
        password=password,
        port=rds_port
    )
    cur = conn.cursor()
    query = sql.SQL("""
        INSERT INTO streams (
            stream_id,
            broadcaster_username,
            stream_title,
            started_at,
            ended_at,
            start_follows,
            end_follows,
            start_subs,
            end_subs
            
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """)

    cur.execute(query, (
        stream_id,
        broadcaster_username,
        stream_title,
        started_at,
        ended_at,
        start_follows,
        end_follows,
        start_subs,
        end_subs
    ))

    conn.commit()
    cur.close()
    conn.close()

def lambda_handler(event, context):
    try:
        message_data = json.loads(event['body'])

        stream_id = message_data['stream_id']
        broadcaster_username = message_data['broadcaster_username']
        stream_title = message_data['stream_title']
        started_at = message_data['started_at']
        try:
            parsed_started_at = parse_datetime(started_at)
        except ValueError as e:
            print(f"Failed to parse timestamp: {started_at} | Error: {e}")
            return {
                "statusCode": 500,
                "body": json.dumps({"message": f"Failed to parse timestamp: {started_at} | Error: {e}"})
            }

        start_follows = message_data['start_follows']
        start_subs = message_data['start_subs']

        ended_at = message_data.get('ended_at', None)
        parsed_ended_at = None
        if ended_at is not None:
            try:
                parsed_ended_at = parse_datetime(ended_at)
            except ValueError as e:
                print(f"Failed to parse timestamp: {ended_at} | Error: {e}")
                return {
                    "statusCode": 500,
                    "body": json.dumps({"message": f"Failed to parse timestamp: {ended_at} | Error: {e}"})
                }

        end_follows = message_data.get('end_follows', None)
        end_subs = message_data.get('end_subs', None)

    except KeyError as e:
        print(f"Missing required field: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": f"Missing required field: {e}"})
        }
    except Exception as e:
        print(f"Failed processing message: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": f"Failed processing message: {e}"})
        }

    try:
        print("Connecting to database")
        insert_data_to_postgresql_db(stream_id,
                                     broadcaster_username,
                                     stream_title,
                                     parsed_started_at,
                                     parsed_ended_at,
                                     start_follows,
                                     end_follows,
                                     start_subs,
                                     end_subs)
        print("Data inserted successfully")
    except Exception as e:
            print(f"Error with database: {e}")
            return {
                "statusCode": 500,
                "body": json.dumps({"message": f"Error with database: {e}"})
            }
            

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Data inserted to database"})
    }
