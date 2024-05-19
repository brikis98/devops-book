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
    inline = [
      "curl -fsSL https://rpm.nodesource.com/setup_21.x | sudo bash -",
      "sudo yum install -y nodejs",
      "sudo adduser app-user",                                           
      "sudo mv /tmp/app.js /tmp/app.config.js /home/app-user/",          
      "sudo npm install pm2@latest -g",                                  
      "eval \"$(sudo su app-user bash -c 'pm2 startup' | tail -n1)\""    
    ]
    pause_before = "30s"
  }
}
