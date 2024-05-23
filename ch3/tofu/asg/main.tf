provider "aws" {
  region = "us-east-2"
}

resource "aws_launch_template" "sample_app" {
  name_prefix            = "sample-app-tofu"
  image_id               = var.ami_id                                
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.sample_app.id]        
  user_data              = filebase64("${path.module}/user-data.sh") 
}

resource "aws_security_group" "sample_app" {
  name        = "sample-app-tofu"
  description = "Allow HTTP traffic into the sample app"
}

resource "aws_security_group_rule" "sample_app_allow_http_inbound" {
  type              = "ingress"
  protocol          = "tcp"
  from_port         = 8080
  to_port           = 8080
  security_group_id = aws_security_group.sample_app.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_autoscaling_group" "sample_app" {

  name_prefix         = "sample-app-tofu"
  min_size            = 1                                
  max_size            = 10                               
  desired_capacity    = 3                                
  vpc_zone_identifier = data.aws_subnets.default.ids     

  
  launch_template {
    id      = aws_launch_template.sample_app.id
    version = aws_launch_template.sample_app.latest_version
  }

  
  tag {
    key                 = "Name"
    value               = "sample-app-tofu"
    propagate_at_launch = true
  }

  target_group_arns = [aws_lb_target_group.sample_app.arn] 
  health_check_type = "ELB"                                

  instance_refresh {
    strategy = "Rolling"             
    preferences {
      min_healthy_percentage = 100   
      max_healthy_percentage = 200   
      auto_rollback          = true  
    }
  }
}

resource "aws_lb" "sample_app" {
  name               = "sample-app-tofu"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]  
  subnets            = data.aws_subnets.default.ids 
}

resource "aws_lb_target_group" "sample_app" {
  name     = "sample-app-tofu"
  port     = 8080                                   
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  
  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
  }
}

resource "aws_lb_listener" "sample_app" {
  load_balancer_arn = aws_lb.sample_app.arn
  port              = 80                            
  protocol          = "HTTP"

  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.sample_app.arn
  }
}

resource "aws_security_group" "alb" {
  name        = "sample-app-alb-tofu"
  description = "Allow HTTP traffic into the sample app ALB"
}

resource "aws_security_group_rule" "alb_allow_http_inbound" {
  type              = "ingress"
  protocol          = "tcp"
  from_port         = 80
  to_port           = 80
  security_group_id = aws_security_group.alb.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "alb_allow_all_outbound" {
  type              = "egress"
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  security_group_id = aws_security_group.alb.id
  cidr_blocks       = ["0.0.0.0/0"]
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

