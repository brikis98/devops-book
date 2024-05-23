provider "aws" {
  region = "us-east-2"
}

module "sample_app_1" {
  source = "../../modules/ec2-instance"

  # TODO: fill in with your own AMI ID!
  ami_id = "ami-09a9ad4735def0515"

  name = "sample-app-tofu-1"
}

module "sample_app_2" {
  source = "../../modules/ec2-instance"

  # TODO: fill in with your own AMI ID!
  ami_id = "ami-09a9ad4735def0515"

  name = "sample-app-tofu-2"
}
