output "app_endpoint" {
  description = "API Gateway endpoint for the app"
  value       = module.app_gateway.api_endpoint
}

output "db_name" {
  description = "The name of the database"
  value       = module.rds_postgres.db_name
}

output "db_host" {
  description = "The hostname of the database"
  value       = module.rds_postgres.hostname
}

output "db_port" {
  description = "The port of the database"
  value       = module.rds_postgres.port
}