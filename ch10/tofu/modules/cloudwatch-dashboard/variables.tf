# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the dashboard and all other resources"
  type        = string
}

variable "alb_name" {
  description = "The name of the ALB"
  type        = string
}

variable "alb_arn_suffix" {
  description = "The unique ID added as a suffix to the ALB's ARN"
  type        = string
}

variable "asg_name" {
  description = "The name of the ASG"
  type        = string
}

variable "health_check_id" {
  description = "The ID of the Route 53 health check for the ALB"
  type        = string
}