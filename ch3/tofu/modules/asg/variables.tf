# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the ASG and all other resources"
  type        = string
}

variable "min_size" {
  description = "The minimum number of instances in the ASG"
  type        = number
}

variable "max_size" {
  description = "The maximum number of instances in the ASG"
  type        = number
}

variable "app_http_port" {
  description = "The port the app listens on for HTTP requests"
  type        = number
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "ami_name" {
  description = "The name of the AMI to run on the EC2 instance. This module will search for the most recent version of the AMI with this name, so wildcards (e.g., my-app-*) are allowed."
  type        = string
  default     = "sample-app-packer-*"
}

variable "instance_type" {
  description = "The type of EC2 instances to deploy (e.g., t2.micro)"
  type        = string
  default     = "t2.micro"
}

variable "instance_refresh" {
  description = "Set this parameter to enable ASG instance refresh"
  type = object({
    min_healthy_percentage = number
    max_healthy_percentage = number
    auto_rollback          = bool
  })
  default = null
}

variable "target_group_arns" {
  description = "The ARNs of target groups in which to register instances"
  type        = list(string)
  default     = []
}

variable "user_data" {
  description = "The base64-encoded user data script to run on each instance"
  type        = string
  default     = null
}

variable "desired_capacity" {
  description = "The desired number of instances in the ASG"
  type        = number
  default     = null
}
