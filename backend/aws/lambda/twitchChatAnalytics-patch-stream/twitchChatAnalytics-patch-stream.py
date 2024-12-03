import json
import psycopg2
from psycopg2 import sql
from dateutil.parser import parse as parse_datetime
import os

user_name = os.environ['USER_NAME']
password = os.environ['PASSWORD']
rds_host = os.environ['RDS_HOST']
rds_port = os.environ['RDS_PORT']
rds_db_name = os.environ['RDS_DB_NAME']

def update_data_in_postgresql_db(stream_id, updates):
    conn = psycopg2.connect(
        host=rds_host,
        database=rds_db_name,
        user=user_name,
        password=password,
        port=rds_port
    )
    cur = conn.cursor()

    set_clauses = []
    values = []
    for column, value in updates.items():
        set_clauses.append(f"{column} = %s")
        values.append(value)

    values.append(stream_id)

    query = f"""
        UPDATE streams
        SET {', '.join(set_clauses)}
        WHERE stream_id = %s
    """

    cur.execute(query, values)
    conn.commit()
    cur.close()
    conn.close()

def lambda_handler(event, context):
    try:

        body = json.loads(event['body'])
        stream_id = body.get('stream_id')
        if not stream_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'stream_id is required'})
            }

        updates = {}

        ended_at = body.get('ended_at')
        if ended_at:
            try:
                updates['ended_at'] = parse_datetime(ended_at)
            except ValueError as e:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f"Invalid format for ended_at: {ended_at}"})
                }

        end_follows = body.get('end_follows')
        if end_follows is not None:
            if not isinstance(end_follows, int):
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'end_follows must be an integer'})
                }
            updates['end_follows'] = end_follows

        end_subs = body.get('end_subs')
        if end_subs is not None:
            if not isinstance(end_subs, int):
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'end_subs must be an integer'})
                }
            updates['end_subs'] = end_subs

        if not updates:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No fields to update'})
            }

        update_data_in_postgresql_db(stream_id, updates)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Stream updated successfully'})
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
