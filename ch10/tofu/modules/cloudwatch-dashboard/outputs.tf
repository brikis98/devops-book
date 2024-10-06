output "dashboard_url" {
  description = "The URL of the dashboard"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards/dashboard/${aws_cloudwatch_dashboard.main.dashboard_name}"
}