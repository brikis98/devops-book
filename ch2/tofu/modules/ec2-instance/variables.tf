# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the instance and all other resources"
  type        = string
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
  description = "The type of EC2 instance to deploy (e.g., t2.micro)"
  type        = string
  default     = "t2.micro"
}

variable "http_port" {
  description = "The port the EC2 instance will listen on for HTTP requests"
  type        = number
  default     = 8080
}

variable "key_name" {
  description = "The EC2 key pair to associate with each EC2 instance. If set (if not null), this module will open port 22 in the security group to allow SSH access."
  type        = string
  default     = null
}