# EC2 Instances with Domain Names

This folder contains a root OpenTofu module that uses the [ec2-instances module](../../modules/ec2-instances) to deploy 
multiple EC2 instances and then configures a domain name for them by creating a Route 53 A record.

For more information, see Chapter 7, " How to Set Up Networking", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
