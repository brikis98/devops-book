terraform {
  backend "s3" {
    # TODO: fill in your own bucket name here!
    bucket         = "fundamentals-of-devops-tofu-state" 
    key            = "ch5/tofu/state-bucket"             
    region         = "us-east-2"                         
    encrypt        = true                                
    dynamodb_table = "fundamentals-of-devops-tofu-locks" 
  }
}