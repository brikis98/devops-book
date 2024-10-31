output "sample_app_1_public_ip" {
  description = "The public IP of the sample-app-1 instance"
  value       = module.sample_app_1.public_ip
}

output "sample_app_2_public_ip" {
  description = "The public IP of the sample-app-2 instance"
  value       = module.sample_app_2.public_ip
}

output "sample_app_1_instance_id" {
  description = "The ID of the sample-app-1 instance"
  value       = module.sample_app_1.instance_id
}

output "sample_app_2_instance_id" {
  description = "The ID of the sample-app-2 instance"
  value       = module.sample_app_2.instance_id
}