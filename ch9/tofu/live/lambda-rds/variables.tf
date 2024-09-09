variable "username" {
  description = "Username for master DB user."
  type        = string
}

variable "password" {
  description = "Password for master DB user."
  type        = string
  sensitive   = true
}