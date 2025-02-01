# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "environment" {
  description = "The name of the environment to deploy into"
  type        = string
}

variable "memory_size" {
  description = "The amount of memory, in MB, to assign the function"
  type        = number
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the function and all other resources"
  type        = string
  default     = "lambda-sample"
}
