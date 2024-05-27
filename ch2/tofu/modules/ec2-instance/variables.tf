# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the instance and all other resources"
  type        = string
}

variable "ami_id" {
  description = "The ID of the AMI to run. Should be built from the Packer template in the packer folder."
  type        = string
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

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