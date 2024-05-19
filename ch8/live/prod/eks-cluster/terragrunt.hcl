terraform {
  source = "../../../modules/eks-cluster"
}

include {
  path = find_in_parent_folders()
}

inputs = {
  name = "sample-app-cluster-prod"

  min_size      = 1
  max_size      = 10
  desired_size  = 3
  instance_type = "t2.micro"

  kubernetes_version = "1.29"
}