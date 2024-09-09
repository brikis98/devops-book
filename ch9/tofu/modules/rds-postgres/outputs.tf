output "hostname" {
  description = "The hostname of the DB instance"
  value       = aws_db_instance.postgres.address
}

output "port" {
  description = "The port the DB instance is listening on"
  value       = aws_db_instance.postgres.port
}

output "arn" {
  description = "The ARN of the DB instance"
  value       = aws_db_instance.postgres.arn
}

output "db_name" {
  description = "The name of the (logical) database in the DB instance"
  value       = aws_db_instance.postgres.db_name
}

output "identifier" {
  description = "The identifier for the DB instance"
  value       = aws_db_instance.postgres.identifier
}