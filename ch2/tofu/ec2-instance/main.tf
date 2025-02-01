provider "aws" {                                               
  region = "us-east-2"
}

resource "aws_security_group" "sample_app" {                   
  name        = var.name
  description = "Allow HTTP traffic into ${var.name}"
}

resource "aws_security_group_rule" "allow_http_inbound" {      
  type              = "ingress"
  protocol          = "tcp"
  from_port         = 8080
  to_port           = 8080
  security_group_id = aws_security_group.sample_app.id
  cidr_blocks       = ["0.0.0.0/0"]
}

data "aws_ami" "sample_app" {                                  
  filter {
    name   = "name"
    values = ["sample-app-packer-*"]
  }
  owners      = ["self"]
  most_recent = true
}

resource "aws_instance" "sample_app" {                         
  ami                    = data.aws_ami.sample_app.id
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.sample_app.id]
  user_data              = file("${path.module}/user-data.sh")

  tags = {
    Name = var.name
  }

}
