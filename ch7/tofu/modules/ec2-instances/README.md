# EC2 Instances Module 

This folder contains a reusable OpenTofu module that can do the following:

1. Launch multiple EC2 instances, based on the `num_instances` input variable, each with the type set to the 
   `instance_type` input variable.
2. Configure each EC2 instance to run the AMI and user data passed in via `ami_id` and `user_data` input variables.
3. Configure a security group that allows the instances to receive HTTP requests on the `http_port` input variable. 
4. Configure the EC2 instance to allow SSH access from the EC2 key pair specified via `key_name`. If `key_name` is
   specified, this module also configures the security group to allow SSH access on port 22.

For more information, see Chapter 7, " How to Set Up Networking", of 
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
