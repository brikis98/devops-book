output "function_url" {
  description = "The URL of the Lambda function"
  value       = module.app.function_url
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