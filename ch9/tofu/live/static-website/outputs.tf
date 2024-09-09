output "s3_website_endpoint" {
  description = "The endpoint for the website hosted in the S3 bucket"
  value       = module.s3_bucket.website_endpoint
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = module.cloudfront.domain_name
}
