output "dev_account_id" {
  description = "The ID of the dev account"
  value       = module.child_accounts.dev_account_id
}

output "stage_account_id" {
  description = "The ID of the stage account"
  value       = module.child_accounts.stage_account_id
}

output "prod_account_id" {
  description = "The ID of the prod account"
  value       = module.child_accounts.prod_account_id
}

output "dev_role_arn" {
  description = "The ARN of the IAM role you can use to manage dev from mgmt"
  value       = module.child_accounts.dev_role_arn
}

output "stage_role_arn" {
  description = "The ARN of the IAM role you can use to manage stage from mgmt"
  value       = module.child_accounts.stage_role_arn
}

output "prod_role_arn" {
  description = "The ARN of the IAM role you can use to manage prod from mgmt"
  value       = module.child_accounts.prod_role_arn
}
