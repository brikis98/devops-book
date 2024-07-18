resource "aws_organizations_organization" "org" {
  count = var.create_organization ? 1 : 0

  feature_set                   = var.organizations_feature_set
  aws_service_access_principals = var.organizations_aws_service_access_principals
  enabled_policy_types          = var.organizations_enabled_policy_types
}

resource "aws_organizations_account" "dev" {
  name              = var.dev_account_name
  email             = var.dev_account_email
  close_on_deletion = true
  depends_on        = [aws_organizations_organization.org]
}

resource "aws_organizations_account" "stage" {
  name              = var.stage_account_name
  email             = var.stage_account_email
  close_on_deletion = true
  depends_on        = [aws_organizations_organization.org]
}

resource "aws_organizations_account" "prod" {
  name              = var.prod_account_name
  email             = var.prod_account_email
  close_on_deletion = true
  depends_on        = [aws_organizations_organization.org]
}