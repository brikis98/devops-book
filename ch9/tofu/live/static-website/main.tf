provider "aws" {
  region = "us-east-2"
}

module "s3_bucket" {
  # TODO: replace with URL
  source = "../../modules/s3-website"

  # TODO: fill in your own bucket name!
  name           = "fundamentals-of-devops-static-website" 
  index_document = "index.html"                            
}

locals {
  files_to_upload = {
    for file in fileset(path.module, "content/*"):        
    file => replace(basename(file), "/.*([.].+)$/", "$1") 
    if !startswith(file, "content/.")                     
  }
}

resource "aws_s3_object" "content" {
  for_each      = local.files_to_upload                   
  bucket        = module.s3_bucket.bucket_name            
  key           = trimprefix(each.key, "content/")        
  source        = each.key                                
  etag          = filemd5(each.key)                       
  content_type  = module.s3_bucket.mime_types[each.value] 
  cache_control = "public, max-age=300"                   
}

module "cloudfront" {
  # TODO: replace with URL
  source = "../../modules/cloudfront-s3-website"

  bucket_name             = module.s3_bucket.bucket_name      
  bucket_website_endpoint = module.s3_bucket.website_endpoint 

  min_ttl     = 0                                             
  max_ttl     = 300
  default_ttl = 0

  default_root_object = "index.html"                          
}
