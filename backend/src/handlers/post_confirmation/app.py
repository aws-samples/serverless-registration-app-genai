"""
Cognito invokes this trigger after a signed-up user confirms their user account.
"""

import os
from typing import Any, Dict

import boto3
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.data_classes.cognito_user_pool_event import (
    PostConfirmationTriggerEvent,
)
from aws_lambda_powertools.utilities.typing import LambdaContext

tracer = Tracer()
logger = Logger()
metrics = Metrics(namespace="RegistrationApp")
sns_client = boto3.client("sns")
topic_arn = os.getenv("TOPIC_ARN")


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda entry point"""
    metrics.add_metric(
        name="PostConfirmationInvocations", unit=MetricUnit.Count, value=1
    )
    post_confirmation_trigger_event: PostConfirmationTriggerEvent = (
        PostConfirmationTriggerEvent(event)
    )
    user_attributes = post_confirmation_trigger_event.request.user_attributes
    email = user_attributes["cognito:email_alias"]
    logger.info(f"email: {email}")

    # create SNS subscription
    metrics.add_metric(name="Subscribe", unit=MetricUnit.Count, value=1)
    response = sns_client.subscribe(
        TopicArn=topic_arn,
        Protocol="Email",
        Endpoint=email,
        ReturnSubscriptionArn=True,
    )

    logger.info("response: " + str(response))
    return event  # must return event back to Cognito
