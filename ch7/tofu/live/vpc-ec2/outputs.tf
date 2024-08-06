output "public_instance_public_ip" {
  description = "The public IP of the public instance"
  value       = module.public_instance.public_ips[0]
}

output "public_instance_private_ip" {
  description = "The private IP of the public instance"
  value       = module.public_instance.private_ips[0]
}

output "private_instance_public_ip" {
  description = "The public IP of the private instance"
  value       = module.private_instance.public_ips[0]
}

output "private_instance_private_ip" {
  description = "The private IP of the private instance"
  value       = module.private_instance.private_ips[0]
}