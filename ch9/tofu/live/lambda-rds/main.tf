provider "aws" {
  region = "us-east-2"
}

module "rds_postgres" {
  # TODO: replace with URL
  source = "../../modules/rds-postgres"

  name              = "bank"         
  instance_class    = "db.t4g.micro" 
  allocated_storage = 20             
  username          = var.username   
  password          = var.password   
  backup_retention_period = 14            
  backup_window           = "04:00-05:00" 
}

module "rds_postgres_replica" {
  # TODO: replace with URL
  source = "../../modules/rds-postgres"

  name              = "bank-replica"                   
  replicate_source_db = module.rds_postgres.identifier 
  instance_class    = "db.t4g.micro"                   
}

locals {
  env_vars = {
    NODE_ENV    = "production"
    DB_NAME     = module.rds_postgres.db_name
    DB_HOST     = module.rds_postgres.hostname
    DB_PORT     = module.rds_postgres.port
    DB_USERNAME = var.username
    DB_PASSWORD = var.password
  }
}

module "app" {
  # TODO: replace with URL
  source = "../../../../ch3/tofu/modules/lambda"

  name                  = "lambda-rds-app"     
  src_dir               = "${path.module}/src" 
  handler               = "app.handler"        
  runtime               = "nodejs20.x"         
  environment_variables = merge(local.env_vars, {
    DB_HOST      = module.rds_postgres_replica.hostname
    DB_PORT      = module.rds_postgres_replica.port
  })
  memory_size           = 128
  timeout               = 5
}

module "app_gateway" {
  source = "github.com/brikis98/devops-book//ch3/tofu/modules/api-gateway"

  name               = "lambda-rds-app"        
  function_arn       = module.app.function_arn
  api_gateway_routes = ["GET /"]
}

module "migrations" {
  # TODO: replace with URL
  source = "../../../../ch3/tofu/modules/lambda"

  name                  = "lambda-rds-migrations" 
  src_dir               = "${path.module}/src"    
  handler               = "migrate.handler"       
  runtime               = "nodejs20.x"
  environment_variables = local.env_vars          
  memory_size           = 128
  timeout               = 900                     
}

resource "aws_lambda_invocation" "run_migrations" {
  function_name = module.migrations.function_name 
  input         = ""
  triggers = {                                    
    migrations_changed = join(",", [
      for file in fileset(path.module, "src/migrations/*.js"): filesha256(file)
    ])
  }
  depends_on = [module.rds_postgres]              
}
