output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.cluster.cluster_name
}

output "cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = module.cluster.cluster_arn
}

output "cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.cluster.cluster_endpoint
}

output "cluster_certificate_authority" {
  description = "Certificate authority of the EKS cluster"
  value       = module.cluster.cluster_certificate_authority
}