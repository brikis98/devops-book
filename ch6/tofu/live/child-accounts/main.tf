provider "aws" {
  region = "us-east-2"
}

module "child_accounts" {
  source  = "brikis98/devops/book//modules/aws-organizations"
  version = "1.0.0"

  create_organization = true                 

  accounts = {
    development = "brikis98+devops-book-development@gmail.com"
    staging     = "brikis98+devops-book-staging@gmail.com"
    production  = "brikis98+devops-book-production@gmail.com"
  }
}
