# VPC with EC2 instances

This folder contains a root OpenTofu module that uses the [vpc module](../../modules/vpc) to deploy a VPC and the 
[ec2-instances module](../../modules/ec2-instances) to deploy one EC2 instance into the public subnet of that VPC and
one EC2 instance into the private subnet of that VPC. 

For more information, see Chapter 7, " How to Set Up Networking", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
