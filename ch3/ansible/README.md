# Ansible Server Orchestration

This folder contains an example of how to do server orchestration with Ansible:

* `create_ec2_instances_playbook.yml`: An Ansible playbook to create multiple EC2 instances. You can use it with 
  `sample-app-vars.yml` to create EC2 instances for running Node.js sample apps or `nginx-vars.yml` to create an EC2
  instance for running Nginx.
* `configure_sample_app_playbook.yml`: An Ansible playbook to configure an EC2 instance to run a Node.js "Hello, World"
  sample app that listens on port 8080. Under the hood, uses the Ansible roles in the `roles` folder.
* `configure_nginx_playbook.yml`: An Ansible playbook to configure an EC2 instance to run Nginx as a load balancer
  that routes traffic across EC2 instances running the Node.js sample app.
* `inventory.aws_ec2.yml`: An Ansible dynamic inventory file to discover EC2 instances, which along with the 
  `group_vars` folder will allow you to connect to those instances and can configure them.

For more information, see Chapter 3, "How to Manage Your Apps Using Orchestration Tools", of 
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
