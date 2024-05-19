provider "aws" {
  region = "us-east-2"
}

resource "aws_ecr_repository" "sample_app" {
  name                 = "sample-app" 
  image_tag_mutability = "IMMUTABLE"  

  force_delete = true
}
