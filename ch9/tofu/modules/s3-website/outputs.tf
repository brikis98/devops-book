output "bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.website.id
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.website.arn
}

output "website_endpoint" {
  description = "The endpoint for the website hosted in the S3 bucket"
  value       = aws_s3_bucket_website_configuration.website.website_endpoint
}

output "hosted_zone_id" {
  description = "The hosted zone ID of the S3 bucket"
  value       = aws_s3_bucket.website.hosted_zone_id
}

output "mime_types" {
  description = "A map from file extension to MIME type"
  value = tomap({
    for suffix, types in local.mapping : suffix => types[0]
  })
}