output "s3_bucket_name" {
  value       = aws_s3_bucket.tofu_state.bucket
  description = "The ARN of the S3 bucket"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.tofu_locks.name
  description = "The name of the DynamoDB table"
}
