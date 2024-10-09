provider "aws" {
  region = "us-west-2"
}

module "repo" {
  source = "github.com/brikis98/devops-book//ch3/tofu/modules/ecr-repo"

  name = "sample-app"
}
