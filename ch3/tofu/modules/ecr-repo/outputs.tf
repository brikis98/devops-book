output "registry_url" {
  value       = aws_ecr_repository.sample_app.repository_url
  description = "URL of the ECR repo"
}