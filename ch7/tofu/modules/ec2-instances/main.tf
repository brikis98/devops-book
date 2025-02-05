resource "aws_security_group" "sample_app" {
  name        = var.name
  description = "Allow HTTP traffic into ${var.name}"
  vpc_id      = var.vpc_id
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

resource "aws_security_group_rule" "allow_all_outbound" {
  type              = "egress"
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
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
  count                       = var.num_instances
  ami                         = data.aws_ami.sample_app.id
  instance_type               = var.instance_type
  vpc_security_group_ids      = [aws_security_group.sample_app.id]
  user_data                   = var.user_data
  user_data_replace_on_change = true
  subnet_id                   = var.subnet_id
  key_name                    = var.key_name
  iam_instance_profile        = aws_iam_instance_profile.sample_app.name

  tags = {
    Name = var.name
  }
}

resource "aws_iam_role" "sample_app" {
  name               = var.name
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_instance_profile" "sample_app" {
  name = aws_iam_role.sample_app.name
  role = aws_iam_role.sample_app.name
}