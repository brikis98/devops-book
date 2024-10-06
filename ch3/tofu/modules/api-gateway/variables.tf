# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The base name for the API Gateway and all other resources"
  type        = string
}

variable "function_arn" {
  description = "The ARN of the Lambda function to send HTTP requests to"
  type        = string
}

variable "api_gateway_routes" {
  description = "The HTTP routes the API Gateway should send to your Lambda function. Must be of format 'METHOD PATH': e.g., 'GET /' or 'POST /create'."
  type        = set(string)
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "detailed_metrics_enabled" {
  description = "Set to true to enable metrics in CloudWatch."
  type        = bool
  default     = false
}

variable "throttling_rate_limit" {
  description = "The rate per second limit for the API"
  type        = number
  default     = 10000
}

variable "throttling_burst_limit" {
  description = "The burst rate per second limit for the API"
  type        = number
  default     = 10000
}
