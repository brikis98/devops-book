# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the Lambda function and all other resources"
  type        = string
}

variable "src_dir" {
  description = "The directory where your Lambda source code lives. This will be zipped up into a deployment package."
  type        = string
}

variable "runtime" {
  description = "The Lambda runtime to use. See https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html#runtimes-supported for supported runtimes."
  type        = string
}

variable "handler" {
  description = "The handler (entrypoint) for your Lambda function."
  type        = string
}

variable "memory_size" {
  description = "The amount of memory, in MB, to give the Lambda function. See https://docs.aws.amazon.com/lambda/latest/operatorguide/computing-power.html for supported configurations."
  type        = number
}

variable "timeout" {
  description = "The timeout, in seconds, for the Lambda function. Max is 15 minutes (900 seconds)."
  type        = number
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "environment_variables" {
  description = "The environment variables to set for the Lambda function."
  type        = map(string)
  default     = {}
}