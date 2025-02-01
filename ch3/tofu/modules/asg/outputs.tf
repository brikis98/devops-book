output "asg_name" {
  description = "The name of the ASG"
  value       = aws_autoscaling_group.sample_app.name
}