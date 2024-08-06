provider "aws" {
  region = "us-east-2"
}

module "vpc" {
  source = "github.com/brikis98/devops-book//ch7/tofu/modules/vpc"

  name       = "example-vpc"   
  cidr_block = "10.0.0.0/16"   
}

module "public_instance" {
  source = "github.com/brikis98/devops-book//ch7/tofu/modules/ec2-instances"

  name          = "public-instance"                   
  num_instances = 1                                   
  instance_type = "t2.micro"
  ami_id        = "ami-0900fe555666598a2"
  http_port     = 80
  user_data     = file("${path.module}/user-data.sh") 
  vpc_id        = module.vpc.vpc.id                   
  subnet_id     = module.vpc.public_subnet.id         

}

module "private_instance" {
  source = "github.com/brikis98/devops-book//ch7/tofu/modules/ec2-instances"

  name          = "private-instance"                   
  num_instances = 1
  instance_type = "t2.micro"
  ami_id        = "ami-0900fe555666598a2"
  http_port     = 80
  user_data     = file("${path.module}/user-data.sh")
  vpc_id        = module.vpc.vpc.id
  subnet_id     = module.vpc.private_subnet.id         

}
