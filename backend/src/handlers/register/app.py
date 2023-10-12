"""
Accepts registration information and sends it to an SQS queue for downstream
processing by another Lambda function.
"""

import json
import os
from datetime import datetime

import boto3
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext

app = APIGatewayRestResolver()
tracer = Tracer()
logger = Logger()
metrics = Metrics(namespace="RegistrationApp")
dynamodb_client = boto3.client("dynamodb")
sqs_client = boto3.client("sqs")
table_name = os.getenv("TABLE_NAME")
queue_url = os.getenv("QUEUE_URL")


@app.exception_handler(ValueError)
def handle_malformed_request(ex: ValueError):
    """Exception handler"""
    metadata = {
        "path": app.current_event.path,
        "decoded_body": app.current_event.decoded_body,
    }
    logger.error(f"Malformed request: {ex}", extra=metadata)

    raise BadRequestError("Malformed request")  # HTTP 400


@app.post("/register", cors=True)
@tracer.capture_method
def register():
    """Handle POST /register action"""
    metrics.add_metric(name="RegisterInvocations", unit=MetricUnit.Count, value=1)
    post_data: dict = app.current_event.json_body
    logger.debug(f"post_data => {post_data}")

    # {'userAttributes': {
    #   'sub': '8448b4a8-0041-7022-555e-ca588f55b8b9',
    #   'email_verified': True,
    #   'given_name': 'John',
    #   'family_name': 'Doe',
    #   'email': 'jdoe@example.com'},
    #   'message': 'Lorem ipsum dolor sit amet'
    # }

    email = post_data["userAttributes"]["email"]
    profile = post_data["message"]
    tracer.put_annotation(key="email", value=email)
    save_profile_to_dynamodb(email, profile)
    sqs_client.send_message(QueueUrl=queue_url, MessageBody=json.dumps(post_data))


@tracer.capture_method
def save_profile_to_dynamodb(email: str, profile_text: str):
    """Save profile to DynamoDB"""
    logger.info("saving profile to DynamoDB")
    dynamodb_client.put_item(
        TableName=table_name,
        Item={
            "email": {"S": email},
            "profile_text": {"S": profile_text},
            "created_at": {"S": str(datetime.now())},
        },
    )


@logger.inject_lambda_context(
    correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True
)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    """Lambda entry point"""
    return app.resolve(event, context)
