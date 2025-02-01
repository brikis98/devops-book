output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.tofu_state.bucket
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.tofu_locks.name
}
