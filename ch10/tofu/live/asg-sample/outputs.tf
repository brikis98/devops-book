output "alb_dns_name" {
  description = "The domain name of the ALB"
  value       = module.alb.alb_dns_name
}

output "dashboard_url" {
  description = "The URL of the dashboard"
  value       = module.cloudwatch_dashboard.dashboard_url
}
