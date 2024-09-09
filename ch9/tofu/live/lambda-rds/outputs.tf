output "app_endpoint" {
  description = "API Gateway endpoint for the app"
  value       = module.app_gateway.api_endpoint
}

output "migrations_results" {
  description = "The result of applying migrations"
  value       = jsondecode(aws_lambda_invocation.run_migrations.result)
}