output "alb_dns_name" {
  value = aws_lb.sample_app.dns_name
}

output "target_group_arn" {
  value = aws_lb_target_group.sample_app.arn
}