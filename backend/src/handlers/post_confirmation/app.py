"""
Cognito invokes this trigger after a signed-up user confirms their user account.
"""

import os

import boto3
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.data_classes.cognito_user_pool_event import (
    PostConfirmationTriggerEvent,
)

tracer = Tracer()
logger = Logger()
metrics = Metrics(namespace="RegistrationApp")
sns_client = boto3.client("sns")
topic_arn = os.getenv("TOPIC_ARN")


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event, context):
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
