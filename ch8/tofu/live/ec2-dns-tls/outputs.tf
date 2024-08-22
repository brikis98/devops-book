output "domain_name" {
  description = "The domain name for the EC2 instances"
  value       = aws_route53_record.www.name
}

output "instance_ips" {
  description = "The IPs of the EC2 instances"
  value       = module.instances.public_ips
}
