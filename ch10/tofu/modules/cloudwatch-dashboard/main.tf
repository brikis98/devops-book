locals {
  widgets = [
    {
      title = "Requests"
      metrics = [[
        "AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix,
        { label = var.alb_name, region = data.aws_region.current.name }
      ]]
      stat   = "Sum"
      period = 60
      region = data.aws_region.current.name
    },
    {
      title = "Response Time (Avg)"
      metrics = [[
        "AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix,
        { label = var.alb_name, region = data.aws_region.current.name }
      ]]
      stat   = "Average"
      period = 60
      region = data.aws_region.current.name
    },
    {
      title = "Response Time (p99)"
      metrics = [[
        "AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix,
        { label = var.alb_name, region = data.aws_region.current.name, stat = "p99" }
      ]]
      stat   = "Average"
      period = 60
      region = data.aws_region.current.name
    },
    {
      title = "CPU Utilization (Percent)"
      metrics = [[
        "AWS/EC2", "CPUUtilization", "AutoScalingGroupName", var.asg_name
      ]]
      view    = "timeSeries"
      stacked = false
      period  = 60
      region  = data.aws_region.current.name
    },
    {
      title = "NetworkIn"
      metrics = [[
        "AWS/EC2", "NetworkIn", "AutoScalingGroupName", var.asg_name
      ]]
      view    = "timeSeries"
      stacked = false
      stat    = "Average"
      period  = 300
      region  = data.aws_region.current.name
    },
    {
      title = "NetworkOut"
      metrics = [[
        "AWS/EC2", "NetworkOut", "AutoScalingGroupName", var.asg_name
      ]]
      view    = "timeSeries"
      stacked = false
      stat    = "Average"
      period  = 300
      region  = data.aws_region.current.name
    },
    {
      title = "Health Check Status"
      metrics = [[
        "AWS/Route53", "HealthCheckStatus", "HealthCheckId", var.health_check_id
      ]]
      view    = "timeSeries"
      stacked = false
      period  = 60
      region  = "us-east-1" # All Route 53 health check stats are in us-east-1
      stat    = "Minimum"
    },
    {
      title = "Health Check Percentage Healthy"
      metrics = [[
        "AWS/Route53", "HealthCheckPercentageHealthy", "HealthCheckId", var.health_check_id
      ]]
      view    = "timeSeries"
      stacked = false
      period  = 60
      region  = "us-east-1" # All Route 53 health check stats are in us-east-1
      stat    = "Average"
    },
  ]

  widget_height   = 6
  widget_width    = 6
  widgets_per_row = 4

  widgets_cloudwatch_format = [for index, widget in local.widgets : {
    x          = (index % local.widgets_per_row) * local.widget_width
    y          = floor(index / local.widgets_per_row) * local.widget_height
    width      = local.widget_width
    height     = local.widget_height
    type       = "metric"
    properties = widget
  }]
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = var.name

  dashboard_body = jsonencode({
    widgets = local.widgets_cloudwatch_format
  })
}

data "aws_region" "current" {}