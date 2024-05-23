# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The name of the API Gateway and all other resources created by this module"
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