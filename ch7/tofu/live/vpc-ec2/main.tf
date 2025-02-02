provider "aws" {
  region = "us-east-2"
}

module "vpc" {
  source  = "brikis98/devops/book//modules/vpc"
  version = "0.0.2"

  name       = "example-vpc"   
  cidr_block = "10.0.0.0/16"   
}

data "aws_ami" "amazon_linux" {                       
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
  owners      = ["amazon"]
  most_recent = true
}

module "public_instance" {                            
  source  = "brikis98/devops/book//modules/ec2-instances"
  version = "0.0.2"

  name          = "public-instance"                   
  num_instances = 1                                   
  instance_type = "t2.micro"
  ami_id        = data.aws_ami.amazon_linux.id        
  http_port     = 80
  user_data     = file("${path.module}/user-data.sh") 
  vpc_id        = module.vpc.vpc.id                   
  subnet_id     = module.vpc.public_subnet.id         

  # TODO: fill in your EC2 key pair name
  key_name = "<YOUR_KEYPAIR_NAME>"

}

module "private_instance" {
  source  = "brikis98/devops/book//modules/ec2-instances"
  version = "0.0.2"

  name          = "private-instance"                   
  num_instances = 1
  instance_type = "t2.micro"
  ami_id        = data.aws_ami.amazon_linux.id
  http_port     = 80
  user_data     = file("${path.module}/user-data.sh")
  vpc_id        = module.vpc.vpc.id
  subnet_id     = module.vpc.private_subnet.id         

  # TODO: fill in your EC2 key pair name
  key_name = "<YOUR_KEYPAIR_NAME>"
}
