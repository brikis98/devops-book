# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The name of the S3 bucket and all other resources"
  type        = string
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "index_document" {
  description = "The suffix to use for directory requests. E.g., If you set this to index.html, a request for /foo will return /foo/index.html."
  type        = string
  default     = "index.html"
}

variable "force_destroy" {
  description = "If set to true, delete the contents of this bucket when you run 'destroy'"
  type        = bool
  default     = true
}