from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext


# cors_config = CORSConfig()
app = APIGatewayRestResolver()
tracer = Tracer()
logger = Logger()
metrics = Metrics(namespace="MyNamespace")


@app.post("/register", cors=True)
def register() -> dict:
    metrics.add_metric(name="RegisterInvocations", unit=MetricUnit.Count, value=1)
    post_data: dict = app.current_event.json_body
    logger.info(f"post_data => {post_data}")
    return app.current_event.json_body


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context)
