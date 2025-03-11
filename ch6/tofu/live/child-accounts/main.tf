provider "aws" {
  region = "us-east-2"
}

module "child_accounts" {
  source  = "brikis98/devops/book//modules/aws-organizations"
  version = "1.0.0"

  create_organization = true                 

  # TODO: fill in your own account emails!
  accounts = {                               
    development = "username+dev@email.com"
    staging     = "username+stage@email.com"
    production  = "username+prod@email.com"
  }

}
