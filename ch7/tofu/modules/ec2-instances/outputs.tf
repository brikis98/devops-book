output "instance_ids" {
  description = "The IDs of the EC2 instances"
  value       = aws_instance.sample_app[*].id
}

output "security_group_id" {
  description = "The ID of the security group"
  value       = aws_security_group.sample_app.id
}

output "public_ips" {
  description = "The public IP address of the EC2 instances"
  value       = aws_instance.sample_app[*].public_ip
}

output "private_ips" {
  description = "The private IP address of the EC2 instances"
  value       = aws_instance.sample_app[*].private_ip
}

output "iam_role_name" {
  description = "The name of the IAM role attached to the EC2 instances"
  value       = aws_iam_role.sample_app.name
}