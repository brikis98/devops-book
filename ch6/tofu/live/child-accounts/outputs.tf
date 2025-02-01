output "accounts" {
  description = "A map of accounts: {account_name = {id, iam_role_arn}}."
  value       = module.child_accounts.accounts
}
