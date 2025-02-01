output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = module.state.s3_bucket_name
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table"
  value       = module.state.dynamodb_table_name
}
