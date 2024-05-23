resource "aws_ecr_repository" "sample_app" {
  name                 = var.name
  image_tag_mutability = "IMMUTABLE"
  force_delete         = true
}
