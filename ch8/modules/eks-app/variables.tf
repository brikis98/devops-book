variable "name" {
  description = "The base name for the app and all other resources"
  type        = string
}

variable "replicas" {
  description = "How many replicas to run of this app"
  type        = number
}

variable "image" {
  description = "The Docker image to deploy for this app"
  type        = string
}

variable "image_version" {
  description = "The version (tag) of the Docker image to deploy"
  type        = string
}

variable "container_port" {
  description = "The port the Docker image listens on for HTTP requests"
  type        = number
}

variable "environment_variables" {
  description = "The environment variables to set for the app"
  type        = map(string)
}

variable "eks_cluster_name" {
  description = "The name of the EKS cluster"
  type        = string
}
