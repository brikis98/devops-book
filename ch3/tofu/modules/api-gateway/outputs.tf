output "api_endpoint" {
  description = "The endpoint for the API Gateway"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "api_id" {
  description = "The ID of the API Gateway"
  value       = aws_apigatewayv2_api.api.id
}

