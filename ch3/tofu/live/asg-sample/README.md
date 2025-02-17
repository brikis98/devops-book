# VM Orchestration Module

This folder contains a root OpenTofu module that shows an example of VM orchestration. It uses the 
[asg](../../modules/asg) module to deploy an ASG running a Node.js "Hello, World" app, and the [alb](../../modules/alb) 
module to deploy an ALB that routes traffic across the ASG.

For more information, see Chapter 3, "How to Manage Your Apps Using Orchestration Tools", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
