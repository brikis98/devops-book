output "alb_dns_name" {
  description = "The ALB's domain name"
  value       = module.alb.alb_dns_name
}
