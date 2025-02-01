provider "aws" {
  region = "us-east-2"
}

module "child_accounts" {
  source = "github.com/brikis98/devops-book//ch6/tofu/modules/aws-organizations"

  # Set to false if you already enabled AWS Organizations in your account
  create_organization = true

  accounts = {
    development = "brikis98+devops-book-development@gmail.com"
    staging     = "brikis98+devops-book-staging@gmail.com"
    production  = "brikis98+devops-book-production@gmail.com"
  }
}
