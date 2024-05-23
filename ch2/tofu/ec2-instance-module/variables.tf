variable "name" {
  description = "The name of the EC2 instance and all other resources created by this module"
  type        = string
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

variable "ami_id" {
  description = "The ID of the AMI to run. Should be built from the Packer template in the packer folder."
  type        = string
}