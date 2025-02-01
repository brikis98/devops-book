# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "accounts" {
  description = "A map of accounts to create, where the key is the account name, and the value is the email address for the root user of the account."
  type = map(string)
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "create_organization" {
  description = "Set to true to enable AWS organizations in this account. Set to false if it is already enabled."
  type        = bool
  default     = true
}

variable "organizations_feature_set" {
  description = "Feature set to enable: either ALL or CONSOLIDATED_BILLING."
  type        = string
  default     = "ALL"
}
variable "organizations_aws_service_access_principals" {
  # See https://docs.aws.amazon.com/organizations/latest/userguide/orgs_integrate_services.html
  description = "AWS service principal names to enable."
  type        = list(string)
  default = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "sso.amazonaws.com"
  ]
}

variable "organizations_enabled_policy_types" {
  # See https://docs.aws.amazon.com/organizations/latest/APIReference/API_EnablePolicyType.html
  description = "Policy types to enable in the Organization Root."
  type        = list(string)
  default = [
    "SERVICE_CONTROL_POLICY",
    "TAG_POLICY",
    "BACKUP_POLICY",
  ]
}

