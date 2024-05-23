provider "aws" {
  region = "us-east-2"
}

module "repo" {
  source = "github.com/brikis98/fundamentals-of-devops-code//ch3/tofu/modules/ecr-repo"

  name = "sample-app"
}
