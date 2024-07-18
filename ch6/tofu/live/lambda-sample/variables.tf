variable "name" {
  description = "The base name for the function and all other resources"
  type        = string
  default     = "lambda-sample"
}

variable "aws_profile" {
  description = "If specified, the profile to use to authenticate to AWS."
  type        = string
  default     = null
}
