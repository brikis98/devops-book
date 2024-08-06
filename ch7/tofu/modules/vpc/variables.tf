# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The name for the VPC and all other resources"
  type        = string
}

variable "cidr_block" {
  description = "The IP address range, in CIDR notation, to use for this VPC."
  type        = string
}