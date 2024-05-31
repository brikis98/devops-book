provider "aws" {
  region = "us-east-2"
}

module "sample_app_1" {
  source = "github.com/brikis98/devops-book//ch2/tofu/modules/ec2-instance"

  # TODO: fill in with your own AMI ID!
  ami_id = "ami-09a9ad4735def0515"

  name = "sample-app-tofu-1"
}

module "sample_app_2" {
  source = "github.com/brikis98/devops-book//ch2/tofu/modules/ec2-instance"

  # TODO: fill in with your own AMI ID!
  ami_id = "ami-09a9ad4735def0515"

  name = "sample-app-tofu-2"
}
