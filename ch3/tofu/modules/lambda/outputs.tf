output "function_arn" {
  value = aws_lambda_function.function.arn
}

output "function_name" {
  value = aws_lambda_function.function.function_name
}

output "function_version" {
  value = aws_lambda_function.function.version
}

output "iam_role_arn" {
  value = aws_iam_role.lambda.arn
}

output "iam_role_name" {
  value = aws_iam_role.lambda.name
}

output "function_url" {
  value = length(aws_lambda_function_url.url) > 0 ? aws_lambda_function_url.url[0].function_url : null
}