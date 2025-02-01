terraform {
  backend "local" {                     
    path = "${var.environment}.tfstate" 
  }
}