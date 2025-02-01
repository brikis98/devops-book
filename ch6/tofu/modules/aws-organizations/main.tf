resource "aws_organizations_organization" "org" {
  count = var.create_organization ? 1 : 0

  feature_set                   = var.organizations_feature_set
  aws_service_access_principals = var.organizations_aws_service_access_principals
  enabled_policy_types          = var.organizations_enabled_policy_types
}

resource "aws_organizations_account" "accounts" {
  for_each          = var.accounts
  name              = each.key
  email             = each.value
  close_on_deletion = true
  depends_on        = [aws_organizations_organization.org]
}
