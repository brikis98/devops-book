resource "aws_security_group" "sample_app" {
  name        = var.name
  description = "Allow HTTP traffic into ${var.name}"
}

resource "aws_security_group_rule" "allow_http_inbound" {
  type              = "ingress"
  protocol          = "tcp"
  from_port         = var.http_port
  to_port           = var.http_port
  security_group_id = aws_security_group.sample_app.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "allow_ssh_inbound" {
  count             = var.key_name == null ? 0 : 1
  type              = "ingress"
  protocol          = "tcp"
  from_port         = 22
  to_port           = 22
  security_group_id = aws_security_group.sample_app.id
  cidr_blocks       = ["0.0.0.0/0"]
}

data "aws_ami" "sample_app" {
  filter {
    name   = "name"
    values = [var.ami_name]
  }
  owners      = ["self"]
  most_recent = true
}

resource "aws_instance" "sample_app" {
  ami                    = data.aws_ami.sample_app.id
  instance_type          = var.instance_type
  vpc_security_group_ids = [aws_security_group.sample_app.id]
  user_data              = file("${path.module}/user-data.sh")
  key_name               = var.key_name

  tags = {
    Name = var.name
  }
}
