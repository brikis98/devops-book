output "lambda_test_role_arn" {
  description = "The ARN of the lambda-tests IAM role"
  value       = aws_iam_role.lambda_tests.arn
}

output "lambda_deploy_plan_role_arn" {
  description = "The ARN of the lambda-deploy-plan IAM role"
  value       = aws_iam_role.lambda_deploy_plan.arn
}

output "lambda_deploy_apply_role_arn" {
  description = "The ARN of the lambda-deploy-apply IAM role"
  value       = aws_iam_role.lambda_deploy_apply.arn
}
