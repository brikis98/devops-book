packer {
  required_plugins {
    amazon = {
      version = ">= 1.3.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "amazon_linux" {
  ami_name        = "sample-app-packer-${uuidv4()}"
  ami_description = "An Amazon Linux 2023 AMI that has a Node.js sample app installed."
  instance_type   = "t2.micro"
  region          = "us-east-2"
  source_ami      = "ami-0900fe555666598a2"
  ssh_username    = "ec2-user"
}

build {
  sources = [
    "source.amazon-ebs.amazon_linux"
  ]

  provisioner "file" {                         
    sources     = ["app.js", "app.config.js"]
    destination = "/tmp/"
  }

  provisioner "shell" {                        
    script       = "install-node.sh"
    pause_before = "30s"
  }
}
