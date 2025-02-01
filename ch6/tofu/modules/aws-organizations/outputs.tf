output "accounts" {
  description = "A map of accounts created, where the key is the account name, and the value is an object that contains the account ID and IAM role ARN."
  value = { for account_name, account in aws_organizations_account.accounts : account_name =>
    {
      id           = account.id
      iam_role_arn = "arn:aws:iam::${account.id}:role/OrganizationAccountAccessRole"
    }
  }
}
