output "lambda_test_role_arn" {
  description = "The ARN of the IAM role for testing"
  value       = length(aws_iam_role.lambda_tests) > 0 ? aws_iam_role.lambda_tests[0].arn : null
}

output "lambda_deploy_plan_role_arn" {
  description = "The ARN of the IAM role for plan"
  value       = length(aws_iam_role.lambda_deploy_plan) > 0 ? aws_iam_role.lambda_deploy_plan[0].arn : null
}

output "lambda_deploy_apply_role_arn" {
  description = "The ARN of the IAM role for apply"
  value       = length(aws_iam_role.lambda_deploy_apply) > 0 ? aws_iam_role.lambda_deploy_apply[0].arn : null
}

