output "alb_dns_name" {
  description = "The domain name of the ALB"
  value       = aws_lb.sample_app.dns_name
}