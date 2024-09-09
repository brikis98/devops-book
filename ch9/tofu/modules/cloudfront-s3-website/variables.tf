# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "bucket_name" {
  description = "The name of the S3 bucket"
  type        = string
}

variable "bucket_website_endpoint" {
  description = "The website endpoint for the S3 bucket"
  type        = string
}

variable "min_ttl" {
  description = "Minimum amount of time, in seconds, that objects should remain in the CloudFront cache before a new request is sent to the origin to check for updates."
  type        = number
}

variable "max_ttl" {
  description = "Maximum amount of time, in seconds, that objects stay in the CloudFront cache before CloudFront sends another request to the origin to see if the object has been updated."
  type        = number
}

variable "default_ttl" {
  description = "Amount of time, in seconds, that objects are allowed to remain in the CloudFront cache before CloudFront sends a new request to the origin server to check if the object has been updated."
  type        = number
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "default_root_object" {
  description = "The default path to request when someone goes to the root domain name"
  type        = string
  default     = "index.html"
}

