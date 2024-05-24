provider "aws" {
  region = "us-east-2"
}

module "state" {
  # TODO: GitHub URL
  source = "../../modules/state-bucket"

  # TODO: fill in your own bucket name!
  name = "fundamentals-of-devops-tofu-state"
}