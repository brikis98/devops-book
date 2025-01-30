# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The name to use for the key. Will be configured as a KMS key alias."
  type        = string
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "administrator_iam_arns" {
  description = "The ARNs of IAM entities who should be given admin (management) rights to the key, but no usage (encrypt/decrypt) rights. The user who runs apply on this module is automatically included as an admin."
  type        = list(string)
  default     = []
}

variable "user_iam_arns" {
  description = "The ARNs of IAM entities who should be given usage (encrypt/decrypt) rights, but no admin (management) rights to the key. The user who runs apply on this module is automatically included as a user."
  type        = list(string)
  default     = []
}

variable "allow_managing_key_with_iam_policies" {
  description = "If set to true, you'll be able to manage permissions for this key with standalone IAM policies (more flexible and convenient). If false, you'll only be able to manage permissions for this key with the key policy created by this module (more secure)."
  type        = bool
  default     = false
}