provider "aws" {
  region = "us-east-2"
}

data "aws_ami" "amazon_linux" {
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
  owners      = ["amazon"]
  most_recent = true
}

module "instances" {
  source  = "brikis98/devops/book//modules/ec2-instances"
  version = "0.0.2"

  name          = "ec2-dns-tls-example"
  num_instances = 3
  instance_type = "t2.micro"
  ami_id        = data.aws_ami.amazon_linux.id
  http_port     = 443 
  user_data     = file("${path.module}/user-data.sh")
}

data "aws_route53_zone" "zone" {
  # TODO: fill in your own domain name!
  name = "fundamentals-of-devops-example.com"
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.zone.id
  # TODO: fill in your own domain name!
  name    = "www.fundamentals-of-devops-example.com"
  type    = "A"
  records = module.instances.public_ips
  ttl     = 300
}

resource "aws_iam_role_policy" "tls_cert_access" {
  role   = module.instances.iam_role_name
  policy = data.aws_iam_policy_document.tls_cert_access.json
}

data "aws_secretsmanager_secret" "certificate" {
  name = "certificate"
}

data "aws_iam_policy_document" "tls_cert_access" {
  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [data.aws_secretsmanager_secret.certificate.arn]
  }
}
