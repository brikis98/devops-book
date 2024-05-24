output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github_actions.arn
}