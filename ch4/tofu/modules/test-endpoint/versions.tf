terraform {
  required_version = "~> 1.8"

  required_providers {
    http = {
      source  = "hashicorp/http"
      version = "~> 3.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.0"
    }
  }
}
