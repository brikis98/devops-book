provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

data "aws_eks_cluster" "cluster" {
  name = var.eks_cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.eks_cluster_name
}

resource "kubernetes_deployment" "app" {
  metadata {
    name = "${var.name}-deployment"
  }

  spec {
    replicas = var.replicas

    template {
      metadata {
        labels = local.pod_label
      }

      spec {
        container {
          name  = var.name
          image = "${var.image}:${var.image_version}"

          port {
            container_port = var.container_port
          }

          dynamic "env" {
            for_each = var.environment_variables
            content {
              name  = env.key
              value = env.value
            }
          }
        }
      }
    }

    selector {
      match_labels = local.pod_label
    }

    strategy {
      type = "RollingUpdate"
      rolling_update {
        max_surge       = var.replicas
        max_unavailable = 0
      }
    }
  }
}

resource "kubernetes_service" "app" {
  metadata {
    name = "${var.name}-loadbalancer"
  }

  spec {
    type = "LoadBalancer"
    port {
      port        = 80
      target_port = var.container_port
      protocol    = "TCP"
    }
    selector = local.pod_label
  }
}

locals {
  pod_label = {
    app = "${var.name}-pods"
  }
}