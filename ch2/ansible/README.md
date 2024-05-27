# Ansible EC2 Instance

This folder contains:

* `create_ec2_instance_playbook.yml`: An Ansible playbook to create an EC2 instance.
* `configure_sample_app_playbook.yml`: An Ansible playbook to configure an EC2 instance to run a Node.js "Hello, World"
  sample app that listens on port 8080. Under the hood, uses the Ansible roles in the `roles` folder.
* `inventory.aws_ec2.yml`: An Ansible dynamic inventory file to discover EC2 instances, which along with the 
  `group_vars` folder will allow you to connect to those instances and can configure them.

For more information, see Chapter 2, "How to Manage Your Infrastructure as Code", of [_Fundamentals of DevOps and 
Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
