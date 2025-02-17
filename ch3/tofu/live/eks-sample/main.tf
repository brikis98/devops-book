provider "aws" {
  region = "us-east-2"
}

module "cluster" {
  source  = "brikis98/devops/book//modules/eks-cluster"
  version = "1.0.0"

  name        = "eks-sample"        
  eks_version = "1.32"              

  instance_type        = "t2.micro" 
  min_worker_nodes     = 3          
  max_worker_nodes     = 10         
}
