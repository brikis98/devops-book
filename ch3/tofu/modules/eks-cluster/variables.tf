# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the EKS cluster and all other resources"
  type        = string
}

variable "eks_version" {
  description = "The version of EKS to deploy. See https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html for available versions."
  type        = string
}

variable "min_worker_nodes" {
  description = "The minimum number of worker nodes"
  type        = number
}

variable "max_worker_nodes" {
  description = "The maximum number of worker nodes"
  type        = number
}

variable "desired_worker_nodes" {
  description = "The desired number of worker nodes"
  type        = number
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "instance_type" {
  description = "The type of EC2 instances to deploy as worker nodes (e.g., t2.micro)"
  type        = string
  default     = "t2.micro"
}

variable "enable_eks_pod_identity_agent" {
  description = "Set to true to install the EKS pod identity agent add-on, which can be used to give Pods IAM permissions."
  type        = bool
  default     = false
}