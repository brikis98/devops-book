resource "aws_apigatewayv2_api" "api" {
  name          = var.name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.function_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "lambda_route" {
  for_each  = var.api_gateway_routes
  api_id    = aws_apigatewayv2_api.api.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    detailed_metrics_enabled = var.detailed_metrics_enabled
    throttling_rate_limit    = var.throttling_rate_limit
    throttling_burst_limit   = var.throttling_burst_limit
  }
}

resource "aws_lambda_permission" "allow_invoke" {
  for_each      = var.api_gateway_routes
  statement_id  = "AllowAPIGatewayToCallSampleAppLambda"
  action        = "lambda:InvokeFunction"
  function_name = var.function_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/${split(" ", each.key)[0]}${split(" ", each.key)[1]}"
}