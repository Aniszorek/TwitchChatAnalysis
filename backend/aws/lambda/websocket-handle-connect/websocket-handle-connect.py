def lambda_handler(event, context):

    print(event)
    print("***")
    print(context)
    return {
        "statusCode": 200
    }