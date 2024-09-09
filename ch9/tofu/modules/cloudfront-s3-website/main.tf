resource "aws_cloudfront_distribution" "website" {
  enabled = true

  default_root_object = var.default_root_object

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = var.bucket_name
    cache_policy_id        = aws_cloudfront_cache_policy.policy.id
    viewer_protocol_policy = "allow-all"
    compress               = true
  }

  origin {
    domain_name = var.bucket_website_endpoint
    origin_id   = var.bucket_name
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }
}

resource "aws_cloudfront_cache_policy" "policy" {
  name = "${var.bucket_name}-policy"

  min_ttl     = var.min_ttl
  max_ttl     = var.max_ttl
  default_ttl = var.default_ttl

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "all"
    }
  }
}