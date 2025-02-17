resource "aws_ecr_repository" "sample_app" {
  name         = var.name
  force_delete = true
}
