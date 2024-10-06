# ASG Metrics Example

This folder contains a root OpenTofu module that shows an example of CloudWatch Metrics. This module deploys the 
following:

* An ASG running a Node.js "Hello, World" app. This is designed to run the AMI built from the Packer template in 
  [ch3/packer](/code/ch3/packer).
* An ALB to route traffic across the ASG.
* A Route 53 health check to monitor the app.
* A CloudWatch Dashboard with some useful metrics for the app.

For more information, see Chapter 10, "How to Monitor Your Systems", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
