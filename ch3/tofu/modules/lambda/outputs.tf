output "function_arn" {
  value = aws_lambda_function.function.arn
}

output "iam_role_arn" {
  value = aws_iam_role.lambda.arn
}