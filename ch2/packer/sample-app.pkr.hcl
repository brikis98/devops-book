packer {
  required_plugins {
    amazon = {
      version = ">= 1.3.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

data "amazon-ami" "amazon-linux" {                    
  filters = {
    name = "al2023-ami-2023.*-x86_64"
  }
  owners      = ["amazon"]
  most_recent = true
  region      = "us-east-2"
}

source "amazon-ebs" "amazon-linux" {                  
  ami_name        = "sample-app-packer-${uuidv4()}"
  ami_description = "Amazon Linux AMI with a Node.js sample app."
  instance_type   = "t2.micro"
  region          = "us-east-2"
  source_ami      = data.amazon-ami.amazon-linux.id
  ssh_username    = "ec2-user"
}

build {                                               
  sources = ["source.amazon-ebs.amazon-linux"]

  provisioner "file" {                                
    source      = "app.js"
    destination = "/home/ec2-user/app.js"
  }

  provisioner "shell" {                               
    script       = "install-node.sh"
    pause_before = "30s"
  }
}