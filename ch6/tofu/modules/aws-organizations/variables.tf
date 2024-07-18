# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "dev_account_email" {
  description = "The email to use for the root user of the dev account."
  type        = string
}

variable "stage_account_email" {
  description = "The email to use for the root user of the stage account."
  type        = string
}

variable "prod_account_email" {
  description = "The email to use for the root user of the prod account."
  type        = string
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "dev_account_name" {
  description = "The name to use for the dev account."
  type        = string
  default     = "development"
}

variable "stage_account_name" {
  description = "The name to use for the stage account."
  type        = string
  default     = "staging"
}

variable "prod_account_name" {
  description = "The name to use for the prod account."
  type        = string
  default     = "production"
}

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
    "config.amazonaws.com"
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

