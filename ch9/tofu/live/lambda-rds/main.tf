provider "aws" {
  region = "us-east-2"
}

module "rds_postgres" {
  source = "github.com/brikis98/devops-book//ch9/tofu/modules/rds-postgres"

  name              = "bank"         
  instance_class    = "db.t4g.micro" 
  allocated_storage = 20             
  username          = var.username   
  password          = var.password   
  backup_retention_period = 14            
  backup_window           = "04:00-05:00" 
}

module "rds_postgres_replica" {
  source = "github.com/brikis98/devops-book//ch9/tofu/modules/rds-postgres"

  name                = "bank-replica"                 
  replicate_source_db = module.rds_postgres.identifier 
  instance_class      = "db.t4g.micro"                 
}

module "app" {
  source = "github.com/brikis98/devops-book//ch3/tofu/modules/lambda"

  name        = "lambda-rds-app"
  src_dir     = "${path.module}/src"    
  handler     = "app.handler"
  runtime     = "nodejs20.x"
  memory_size = 128
  timeout     = 5

  environment_variables = {             
    NODE_ENV    = "production"
    DB_NAME     = module.rds_postgres.db_name
    DB_HOST     = module.rds_postgres.hostname
    DB_PORT     = module.rds_postgres.port
    DB_USERNAME = var.username
    DB_PASSWORD = var.password
  }

}

module "app_gateway" {
  source = "github.com/brikis98/devops-book//ch3/tofu/modules/api-gateway"

  name               = "lambda-rds-app" 
  function_arn       = module.app.function_arn
  api_gateway_routes = ["GET /"]
}
