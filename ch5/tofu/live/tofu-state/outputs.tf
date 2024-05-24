output "s3_bucket_name" {
  value       = module.state.s3_bucket_name
  description = "The ARN of the S3 bucket"
}

output "dynamodb_table_name" {
  value       = module.state.dynamodb_table_name
  description = "The name of the DynamoDB table"
}
