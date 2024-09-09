output "function_arn" {
  value = aws_lambda_function.function.arn
}

output "function_name" {
  value = aws_lambda_function.function.function_name
}

output "iam_role_arn" {
  value = aws_iam_role.lambda.arn
}

output "iam_role_name" {
  value = aws_iam_role.lambda.name
}