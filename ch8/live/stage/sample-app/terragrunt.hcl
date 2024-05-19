terraform {
  source = "../../../modules/eks-app"
}

include {
  path = find_in_parent_folders()
}

dependency "eks_cluster" {
  config_path = "./eks-cluster"
}

dependency "ecr_repo" {
  config_path = "./sample-app-ecr-repo"
}

inputs = {
  name     = "sample-app-stage"
  replicas = 2

  image          = dependency.ecr_repo.outputs.registry_url
  image_version  = "v5"
  container_port = 8080

  environment_variables = {
    NODE_ENV = production
  }

  eks_cluster_name = dependency.eks_cluster.outputs.cluster_name
}