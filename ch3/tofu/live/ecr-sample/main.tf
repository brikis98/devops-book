provider "aws" {
  region = "us-east-2"
}

module "repo" {
  source  = "brikis98/devops/book//modules/ecr-repo"
  version = "0.0.2"

  name = "sample-app"
}
