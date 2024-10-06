output "alb_dns_name" {
  description = "The domain name of the ALB"
  value       = aws_lb.sample_app.dns_name
}

output "alb_name" {
  description = "The name of the ALB"
  value       = aws_lb.sample_app.name
}

output "alb_arn" {
  description = "The ARN of the ALB"
  value       = aws_lb.sample_app.arn
}

output "alb_arn_suffix" {
  description = "The unique ID added as a suffix the ALB ARN. Primarily useful for CloudWatch metrics."
  value       = aws_lb.sample_app.arn_suffix
}

output "target_group_arn" {
  description = "The ARN of the target group"
  value       = aws_lb_target_group.sample_app.arn
}

