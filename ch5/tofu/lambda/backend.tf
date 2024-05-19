terraform {
  backend "s3" {
    # TODO: fill in your own bucket name here!
    bucket         = "ready-for-production-tofu-state" 
    key            = "ch5/tofu/lambda"                 
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "ready-for-production-tofu-locks"
  }
}