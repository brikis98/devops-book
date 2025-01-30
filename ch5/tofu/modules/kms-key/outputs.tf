output "key_arn" {
  description = "The ARN of the KMS key."
  value       = aws_kms_key.key.arn
}

output "key_id" {
  description = "The ID of the KMS key."
  value       = aws_kms_key.key.id
}

output "key_alias" {
  description = "The alias for the KMS key."
  value       = aws_kms_alias.key.name
}