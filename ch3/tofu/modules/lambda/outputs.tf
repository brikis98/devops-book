output "function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.function.arn
}

output "function_name" {
  description = "The name of the Lambda function"
  value       = aws_lambda_function.function.function_name
}

output "function_version" {
  description = "The version of the Lambda function"
  value       = aws_lambda_function.function.version
}

output "iam_role_arn" {
  description = "The ARN of the IAM role attached to the Lambda function"
  value       = aws_iam_role.lambda.arn
}

output "iam_role_name" {
  description = "The name of the IAM role attached to the Lambda function"
  value       = aws_iam_role.lambda.name
}

output "function_url" {
  description = "The Lambda function URL (if enabled)"
  value       = length(aws_lambda_function_url.url) > 0 ? aws_lambda_function_url.url[0].function_url : null
}