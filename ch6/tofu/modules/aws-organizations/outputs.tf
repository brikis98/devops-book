output "dev_account_id" {
  description = "The ID of the dev account"
  value       = aws_organizations_account.dev.id
}

output "stage_account_id" {
  description = "The ID of the stage account"
  value       = aws_organizations_account.stage.id
}

output "prod_account_id" {
  description = "The ID of the prod account"
  value       = aws_organizations_account.prod.id
}

output "dev_role_arn" {
  description = "The ARN of the IAM role you can use to manage the dev account from the management account"
  value       = "arn:aws:iam::${aws_organizations_account.dev.id}:role/OrganizationAccountAccessRole"
}

output "stage_role_arn" {
  description = "The ARN of the IAM role you can use to manage the stage account from the management account"
  value       = "arn:aws:iam::${aws_organizations_account.stage.id}:role/OrganizationAccountAccessRole"
}

output "prod_role_arn" {
  description = "The ARN of the IAM role you can use to manage the prod account from the management account"
  value       = "arn:aws:iam::${aws_organizations_account.prod.id}:role/OrganizationAccountAccessRole"
}