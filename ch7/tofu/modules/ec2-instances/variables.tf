# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the EC2 instances and all other resources"
  type        = string
}

variable "num_instances" {
  description = "How many EC2 instances to launch"
  type        = number
}

variable "instance_type" {
  description = "The type of EC2 instances to run"
  type        = string
}

variable "ami_id" {
  description = "The ID of the AMI to run on each instance"
  type        = string
}

variable "http_port" {
  description = "The port the instances will listen on for HTTP requests"
  type        = number
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "user_data" {
  description = "The user data script to run on each instance"
  type        = string
  default     = null
}

variable "vpc_id" {
  description = "The ID of the VPC to deploy into. If null, uses the Default VPC."
  type        = string
  default     = null
}

variable "subnet_id" {
  description = "The ID of the subnet to deploy into. If null, uses the Default VPC."
  type        = string
  default     = null
}

variable "key_name" {
  description = "The name of an EC2 key pair which will be allowed to SSH to the EC2 instance."
  type        = string
  default     = null
}