provider "aws" {
  region = "us-east-2"
}

module "instances" {
  source = "github.com/brikis98/devops-book//ch7/tofu/modules/ec2-instances"

  name          = "ec2-dns-tls-example"
  num_instances = 3
  instance_type = "t2.micro"
  ami_id        = "ami-0900fe555666598a2"
  http_port     = 443 
  user_data     = file("${path.module}/user-data.sh")
}

resource "aws_route53_record" "www" {
  # TODO: fill in your own hosted zone ID!
  zone_id = "Z0701806REYTQ0GZ0JCF"
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

data "aws_iam_policy_document" "tls_cert_access" {
  statement {
    effect  = "Allow"
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      "arn:aws:secretsmanager:us-east-2:${local.account_id}:secret:certificate-*"
    ]
  }
}

locals {
  account_id = data.aws_caller_identity.current.account_id
}

data "aws_caller_identity" "current" {}
