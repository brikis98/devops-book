terraform {
  source = "../../../modules/eks-cluster"
}

include {
  path = find_in_parent_folders()
}

inputs = {
  name = "sample-app-cluster-stage"

  min_size      = 1
  max_size      = 3
  desired_size  = 2
  instance_type = "t2.micro"

  kubernetes_version = "1.29"
}