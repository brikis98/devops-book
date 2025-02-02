provider "aws" {
  region = "us-east-2"
}

module "state" {
  source  = "brikis98/devops/book//modules/state-bucket"
  version = "0.0.2"

  # TODO: fill in your own bucket name!
  name = "fundamentals-of-devops-tofu-state"
}