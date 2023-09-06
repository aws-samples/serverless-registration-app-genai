""" Lambda function handler """

import os
from typing import Dict, List, Optional

import boto3
from botocore.exceptions import ClientError
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
sns_client = boto3.client("sns")
topic_arn = os.getenv("TOPIC_ARN")


def list_subscriptions_by_topic(arn) -> List[str]:
    """
    Lists all SNS notification subscriptions using paginator.
    """
    try:
        paginator = sns_client.get_paginator("list_subscriptions_by_topic")
        paginator_params = {"TopicArn": arn}
        page_iterator = paginator.paginate(**paginator_params).build_full_result()
        subscriptions = []
        # loop through each page from page_iterator
        for page in page_iterator["Subscriptions"]:
            subscriptions.append(page["SubscriptionArn"])
    except ClientError:
        logger.exception("Could not list SNS subscriptions.")
        raise
    else:
        return subscriptions


def get_subscription_attributes(subscription_arn: str) -> Dict:
    """
    Gets all subscription attributes
    """
    response = sns_client.get_subscription_attributes(SubscriptionArn=subscription_arn)
    logger.info("Subscription attributes: " + str(response))
    return response["Attributes"]


@app.exception_handler(ValueError)
def handle_malformed_request(ex: ValueError):
    """
    Exception handler
    """
    metadata = {
        "path": app.current_event.path,
        "decoded_body": app.current_event.decoded_body,
    }
    logger.error(f"Malformed request: {ex}", extra=metadata)

    raise BadRequestError("Malformed request")  # HTTP 400


@app.get("/subscription_confirmed", cors=True)
@tracer.capture_method
def subscription_confirmed() -> Dict:
    """Handle GET /subscription_confirmed action"""
    metrics.add_metric(
        name="SubscriptionConfirmedInvocations", unit=MetricUnit.Count, value=1
    )
    email: Optional[str] = app.current_event.query_string_parameters.get("id")
    if email is None:
        raise BadRequestError("id parameter missing")
    subscriptions = sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
    is_subscription_confirmed = False
    for subscription in subscriptions["Subscriptions"]:
        logger.info("Subscription ARN: " + subscription["SubscriptionArn"])
        subscription_attributes = get_subscription_attributes(
            subscription["SubscriptionArn"]
        )
        logger.info("Subscription attributes: " + str(subscription_attributes))
        if (
            subscription_attributes["Endpoint"] == email
            and subscription_attributes["PendingConfirmation"] == "false"
        ):
            is_subscription_confirmed = True
    return {"subscription_confirmed": is_subscription_confirmed}


@logger.inject_lambda_context(
    correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True
)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    """Lambda entry point"""
    return app.resolve(event, context)
