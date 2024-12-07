import boto3
import json
import urllib.parse
import psycopg2
from psycopg2 import sql
import os

def insert_data_to_postgresql_db(data):
    user_name = os.environ['USER_NAME']
    password = os.environ['PASSWORD']
    rds_host = os.environ['RDS_HOST']
    rds_port = os.environ['RDS_PORT']
    rds_db_name = os.environ['RDS_DB_NAME']

    broadcaster_user_login = data.get("broadcaster_user_login")
    stream_id = data.get("stream_id")
    chatter_user_login = data.get("chatter_user_login")
    message_text = data.get("message_text")
    nlp_classification = data.get("nlp_classification")
    timestamp = data.get("timestamp")

    # Init database connection
    try:
        print("Establishing database connection...")
        conn = psycopg2.connect(
            host =      rds_host,
            database =  rds_db_name,
            user =      user_name,
            password =  password,
            port =      rds_port
        )
        print("Database connection established successfully.")
    except Exception as e:
        print(f"Error while connecting to database: {e}")
        raise

    try:
        cur = conn.cursor()

        # Prepare query
        query = sql.SQL("""
                INSERT INTO messages (
                    stream_id,
                    broadcaster_user_login,
                    chatter_user_login,
                    message_text,
                    timestamp,
                    nlp_classification
                ) VALUES (
                    %s, %s, %s, %s, %s, %s
                )
            """)

        # Execute query
        print("Executing query to insert data into the database...")
        cur.execute(query, (
            stream_id,
            broadcaster_user_login,
            chatter_user_login,
            message_text,
            timestamp,
            nlp_classification
        ))

        conn.commit()
        print("Data inserted successfully.")
    except Exception as e:
        print(f"Error while executing query or committing data: {e}")
        conn.rollback()  # Rollback in case of error
        raise
    finally:
        # Close db connection
        cur.close()
        conn.close()
        print("Database connection closed.")

def lambda_handler(event, context):
    try:
        print("Lambda function invoked.")
        print(f"Received event: {json.dumps(event)}")
        body = json.loads(event["body"])
        print("Starting data insertion into PostgreSQL DB...")
        insert_data_to_postgresql_db(body)


        return {
            'statusCode': 200,
            'body': json.dumps('Data inserted successfully')
        }

    except Exception as e:
        print(f"Error in lambda_handler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error processing request: {str(e)}")
        }
