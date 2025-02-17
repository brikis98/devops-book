provider "aws" {
  region = "us-east-2"
}

module "sample_app_1" {

  source  = "brikis98/devops/book//modules/ec2-instance"
  version = "1.0.0"

  name = "sample-app-tofu-1"
}

module "sample_app_2" {
  source  = "brikis98/devops/book//modules/ec2-instance"
  version = "1.0.0"

  name = "sample-app-tofu-2"
}
