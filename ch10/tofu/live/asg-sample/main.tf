provider "aws" {
  region = "us-east-2"
}

module "asg" {
  source = "github.com/brikis98/devops-book//ch3/tofu/modules/asg"

  # TODO: fill in with your own AMI ID!
  ami_id        = "ami-0740b82e74f0b0c97"
  name          = "sample-app-asg"
  user_data     = filebase64("${path.module}/user-data.sh")
  app_http_port = 8080

  instance_type     = "t2.micro"
  min_size          = 1
  max_size          = 10
  desired_capacity  = 3
  target_group_arns = [module.alb.target_group_arn]

  instance_refresh = {
    min_healthy_percentage = 100
    max_healthy_percentage = 200
    auto_rollback          = true
  }
}

module "alb" {
  # TODO: replace with URL
  source = "../../../../ch3/tofu/modules/alb"
  # source = "github.com/brikis98/devops-book//ch3/tofu/modules/alb"

  name                  = "sample-app-alb"
  alb_http_port         = 80
  app_http_port         = 8080
  app_health_check_path = "/"
}

resource "aws_route53_health_check" "example" {
  fqdn              = module.alb.alb_dns_name 
  port              = 80                      
  type              = "HTTP"                  
  resource_path     = "/"                     
  request_interval  = "10"                    
  failure_threshold = 1                       

  tags = {
    Name = "sample-app-health-check"          
  }
}

module "cloudwatch_dashboard" {
  # TODO: replace with URL
  source = "../../modules/cloudwatch-dashboard"

  name            = "sample-app-dashboard"               
  asg_name        = module.asg.asg_name                  
  alb_name        = module.alb.alb_name                  
  alb_arn_suffix  = module.alb.alb_arn_suffix
  health_check_id = aws_route53_health_check.example.id  
}

provider "aws" {
  region = "us-east-1"                                        
  alias  = "us_east_1"
}

resource "aws_cloudwatch_metric_alarm" "sample_app_is_down" {
  provider = aws.us_east_1                                    

  alarm_name          = "sample-app-is-down"                  

  namespace           = "AWS/Route53"                         
  metric_name         = "HealthCheckStatus"
  dimensions = {
    HealthCheckId = aws_route53_health_check.example.id
  }

  statistic           = "Minimum"                             
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  period              = 60
  evaluation_periods  = 1

  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn] 
}

resource "aws_sns_topic" "cloudwatch_alerts" {
  provider = aws.us_east_1

  name = "sample-app-cloudwatch-alerts"                       
}

resource "aws_sns_topic_subscription" "sms" {
  provider = aws.us_east_1

  topic_arn = aws_sns_topic.cloudwatch_alerts.arn 
  protocol  = "email-json"                        

  # TODO: fill in your own email address
  endpoint  = "USERNAME@DOMAIN.COM"               
}
