# EC2 Instance OpenTofu Module

This folder contains a root OpenTofu module that uses the 
[ec2-instance reusable OpenTofu module](../../modules/ec2-instance) directly from a GitHub URL to deploy an EC2 
instance which runs a Node.js "Hello, World" sample app that listens on port 8080.

For more information, see Chapter 2, "How to Manage Your Infrastructure as Code", of [_Fundamentals of DevOps and
Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
