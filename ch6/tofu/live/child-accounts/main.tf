provider "aws" {
  region = "us-east-2"
}

module "child_accounts" {
  source = "github.com/brikis98/devops-book//ch6/tofu/modules/aws-organization"

  # Set to false if you already enabled AWS Organizations in your account
  create_organization = true

  dev_account_email   = "brikis98+devops-book-development@gmail.com"
  stage_account_email = "brikis98+devops-book-staging@gmail.com"
  prod_account_email  = "brikis98+devops-book-production@gmail.com"
}
