resource "aws_launch_template" "sample_app" {
  name_prefix            = var.name
  image_id               = var.ami_id
  instance_type          = var.instance_type
  vpc_security_group_ids = [aws_security_group.sample_app.id]
  user_data              = var.user_data
}

resource "aws_security_group" "sample_app" {
  name        = var.name
  description = "Allow HTTP traffic into ${var.name}"
}

resource "aws_security_group_rule" "sample_app_allow_http_inbound" {
  type              = "ingress"
  protocol          = "tcp"
  from_port         = var.app_http_port
  to_port           = var.app_http_port
  security_group_id = aws_security_group.sample_app.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_autoscaling_group" "sample_app" {

  name_prefix         = var.name
  min_size            = var.min_size                 
  max_size            = var.max_size                 
  desired_capacity    = var.desired_capacity         
  vpc_zone_identifier = data.aws_subnets.default.ids 

  launch_template {
    id      = aws_launch_template.sample_app.id
    version = aws_launch_template.sample_app.latest_version
  }

  tag {
    key                 = "Name"
    value               = var.name
    propagate_at_launch = true
  }

  target_group_arns = var.target_group_arns
  health_check_type = length(var.target_group_arns) > 0 ? "ELB" : "EC2"

  dynamic "instance_refresh" {
    for_each = var.instance_refresh == null ? [] : [1]
    content {
      strategy = "Rolling"
      preferences {
        min_healthy_percentage = var.instance_refresh.min_healthy_percentage
        max_healthy_percentage = var.instance_refresh.max_healthy_percentage
        auto_rollback          = var.instance_refresh.auto_rollback
      }
    }
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

