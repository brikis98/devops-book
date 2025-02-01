output "registry_url" {
  description = "URL of the ECR repo"
  value       = aws_ecr_repository.sample_app.repository_url
}