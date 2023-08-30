""" Lambda function handler """

import os
from datetime import datetime

import boto3
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext
from langchain.llms.bedrock import Bedrock

app = APIGatewayRestResolver()
tracer = Tracer()
logger = Logger()
metrics = Metrics(namespace="RegistrationApp")
dynamodb_client = boto3.client("dynamodb")
table_name = os.getenv("TABLE_NAME")
sns_client = boto3.client("sns")
topic_arn = os.getenv("TOPIC_ARN")
bedrock_client = boto3.client("bedrock")


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    """Lambda entry point"""
    return app.resolve(event, context)


@app.post("/register", cors=True)
def register() -> dict:
    """Handle POST /register action"""
    metrics.add_metric(name="RegisterInvocations", unit=MetricUnit.Count, value=1)
    post_data: dict = app.current_event.json_body
    logger.info(f"post_data => {post_data}")

    email = post_data["email"]
    first_name = post_data["first_name"]
    profile = post_data["profile"]

    tracer.put_annotation(key="email", value=email)
    save_profile_to_dynamodb(email, profile)

    email_body = generate_email_body(first_name, profile)

    save_email_body_to_dynamodb(email, email_body)

    send_email(email_body)

    # TODO error handling case, e.g. unverified email address

    return app.current_event.json_body


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


@tracer.capture_method
def generate_email_body(first_name: str, profile_text: str) -> str:
    """Generate email body"""
    titan_kwargs = {
        "maxTokenCount": 4096,
        "stopSequences": [],
        "temperature": 1.0,
        "topP": 0.9,
    }

    bedrock_llm = Bedrock(
        model_id="amazon.titan-tg1-large",
        client=bedrock_client,
        model_kwargs=titan_kwargs,
    )

    response = bedrock_llm(
        f"""Write an email from the AWS re:Invent team to the customer "{first_name}"
        who registered for the Builder's Session SVS 209. Suggest to him some
        other recommended sessions, based on his interests: {profile_text}."""
    )

    logger.info(response)
    return response


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
        Subject="Your profile",
        Message=profile_text,
        MessageStructure="html",
    )
