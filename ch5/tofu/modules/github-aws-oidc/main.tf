resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = var.provider_url
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]
}

data "tls_certificate" "github" {
  url = var.provider_url
}
