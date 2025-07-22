provider "aws" {
  region = "us-east-2"
}

module "asg" {
  source  = "brikis98/devops/book//modules/asg"
  version = "1.0.0"

  name          = "sample-app-asg"                          
  ami_name      = "sample-app-packer-*"                     
  user_data     = filebase64("${path.module}/user-data.sh") 
  app_http_port = 8080                                      

  instance_type    = "t2.micro"                             
  min_size         = 3                                      
  max_size         = 5                                      

  target_group_arns = [module.alb.target_group_arn]

  instance_refresh = {
    min_healthy_percentage = 100  
    max_healthy_percentage = 200  
    auto_rollback          = true 
  }
}

module "alb" {
  source  = "brikis98/devops/book//modules/alb"
  version = "1.0.0"

  name                  = "sample-app-alb" 
  alb_http_port         = 80               
  app_http_port         = 8080             
  app_health_check_path = "/"              
}
