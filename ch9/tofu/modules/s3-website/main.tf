resource "aws_s3_bucket" "website" {
  bucket        = var.name
  force_destroy = var.force_destroy
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = var.index_document
  }
}

resource "aws_s3_bucket_public_access_block" "allow_public_access" {
  bucket                  = aws_s3_bucket.website.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "allow_public_access" {
  bucket = aws_s3_bucket.website.id
  policy = data.aws_iam_policy_document.allow_public_access.json

  depends_on = [aws_s3_bucket_public_access_block.allow_public_access]
}

data "aws_iam_policy_document" "allow_public_access" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.website.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
}
# From: https://gist.github.com/apparentlymart/e62fb9960e858d5651af932a5107dd29
locals {
  raw_content = file("${path.module}/mime.types")
  raw_lines = [
    for rawl in split("\n", local.raw_content) :
    trimspace(replace(rawl, "/(#.*)/", ""))
  ]
  lines = [
    for l in local.raw_lines : split(" ", replace(l, "/\\s+/", " "))
    if l != ""
  ]
  pairs = flatten([
    for l in local.lines : [
      for suf in slice(l, 1, length(l)) : {
        content_type = l[0]
        suffix = ".${suf}"
      }
    ]
  ])
  # There can potentially be more than one entry for the same
  # suffix in a mime.types file, so we'll gather them all up
  # here and then just discard all but the first one when
  # we produce our result below, mimicking a behavior of
  # scanning through the mime.types file until you find the
  # first mention of a particular suffix.
  mapping = tomap({
    for pair in local.pairs : pair.suffix => pair.content_type...
  })
}