terraform {
  source = "../../../modules/eks-app"
}

include {
  path = find_in_parent_folders()
}

inputs = {
  name = "sample-app"
}