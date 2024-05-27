variable "name" {
  description = "The base name for the EKS cluster and all other resources"
  type        = string
}

variable "min_size" {
  description = "The minimum number of worker nodes to deploy"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "The maximum number of worker nodes to deploy"
  type        = number
  default     = 10
}

variable "desired_size" {
  description = "The desired number of worker nodes to deploy initiall"
  type        = number
  default     = 3
}

variable "kubernetes_version" {
  description = "The version of Kubernetes to use in the EKS cluster"
  type        = string
  default     = "1.29"
}

variable "instance_type" {
  description = "The type of EC2 instance to use for worker nodes"
  type        = string
  default     = "t2.micro"
}