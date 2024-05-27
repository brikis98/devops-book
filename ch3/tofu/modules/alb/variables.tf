# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the ALB and all other resources"
  type        = string
}

variable "app_http_port" {
  description = "The port the app listens on for HTTP requests"
  type        = number
}

variable "app_health_check_path" {
  description = "The path to use for health checks"
  type        = string
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "alb_http_port" {
  description = "The port the ALB listens on for HTTP requests"
  type        = number
  default     = 80
}
