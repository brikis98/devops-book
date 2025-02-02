provider "aws" {
  region = "us-east-2"
}

module "cluster" {
  source  = "brikis98/devops/book//modules/eks-cluster"
  version = "0.0.2"

  name        = "eks-sample"        
  eks_version = "1.29"              

  instance_type        = "t2.micro" 
  min_worker_nodes     = 1          
  max_worker_nodes     = 10         
  desired_worker_nodes = 3          
}
