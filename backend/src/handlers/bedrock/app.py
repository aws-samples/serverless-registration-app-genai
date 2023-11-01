"""
Invokes Bedrock to generate welcome email content and send the email via SNS.
"""

import json
import os
from typing import Any, Dict

import boto3
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.batch import (
    BatchProcessor,
    EventType,
    process_partial_response,
)
from aws_lambda_powertools.utilities.batch.types import PartialItemFailureResponse
from aws_lambda_powertools.utilities.data_classes.sqs_event import SQSRecord
from aws_lambda_powertools.utilities.typing import LambdaContext


app = APIGatewayRestResolver()
tracer = Tracer()
logger = Logger()
processor = BatchProcessor(event_type=EventType.SQS)
metrics = Metrics(namespace="RegistrationApp")
bedrock_client = boto3.client("bedrock-runtime")
dynamodb_client = boto3.client("dynamodb")
sns_client = boto3.client("sns")
table_name = os.getenv("TABLE_NAME")
topic_arn = os.getenv("TOPIC_ARN")


@tracer.capture_method
def generate_email_body(first_name: str, profile_text: str) -> str:
    """Generate email body"""

    with open("session_data.txt", "r", encoding="utf-8") as file:
        session_data = file.read()

    prompt = f"""You are a friendly and creative engineer and writer tasked with generating interest in sessions at a tech conference. Write a welcome email from the AWS re:Invent serverless team to the customer named {first_name} who registered for the Builder's Session SVS 209. Suggest to them three other recommended sessions, based on their interests: {profile_text}. Use the data provided in the following list as a source for recommended sessions: {session_data}."""

    logger.info(f"Prompt: {prompt}")

    body = json.dumps(
        {
            "inputText": prompt,
            "textGenerationConfig": {
                "maxTokenCount": 4096,
                "stopSequences": [],
                "temperature": 1.0,
                "topP": 0.9,
            },
        }
    )

    model_id = "amazon.titan-text-express-v1"
    accept = "application/json"
    content_type = "application/json"

    metrics.add_metric(name="InvokeModel", unit=MetricUnit.Count, value=1)

    response = bedrock_client.invoke_model(
        body=body, modelId=model_id, accept=accept, contentType=content_type
    )
    response_body = json.loads(response.get("body").read())
    answer = response_body.get("results")[0].get("outputText").strip()

    logger.info(answer)
    return answer


@tracer.capture_method
def save_email_body_to_dynamodb(email: str, body: str):
    """Save email body to DynamoDB"""
    logger.info("saving email body to DynamoDB")
    dynamodb_client.update_item(
        TableName=table_name,
        Key={"email": {"S": email}},
        UpdateExpression="SET email_body = :email_body",
        ExpressionAttributeValues={":email_body": {"S": body}},
        ReturnValues="UPDATED_NEW",
    )


@tracer.capture_method
def send_email(profile_text: str):
    """Send email"""
    logger.info("sending email")

    sns_client.publish(
        TopicArn=topic_arn,
        Subject="Welcome to AWS re:Invent Builder's Session SVS 209",
        Message=profile_text,
        MessageStructure="html",
    )


@tracer.capture_method
def record_handler(record: SQSRecord):
    """handle each batch record"""
    payload: str = (
        record.json_body
    )  # if json string data, otherwise record.body for str
    logger.info(payload)
    first_name = payload["userAttributes"]["given_name"]
    profile_text = payload["message"]
    email = payload["userAttributes"]["email"]
    email_body = generate_email_body(first_name, profile_text)
    logger.info(f"Email body: {email_body}")
    save_email_body_to_dynamodb(email, email_body)
    send_email(email_body)


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> PartialItemFailureResponse:
    """Lambda entry point"""
    metrics.add_metric(name="BedrockInvocations", unit=MetricUnit.Count, value=1)
    return process_partial_response(
        event=event,
        record_handler=record_handler,
        processor=processor,
        context=context,
    )
