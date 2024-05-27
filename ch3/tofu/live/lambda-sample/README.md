# Serverless Orchestration Module

This folder contains an example of serverless orchestration. It contains a root OpenTofu module that uses 
the [lambda](../../modules/lambda) to deploy a Node.js "Hello, World" app as Lambda function and the 
[api-gateway](../../modules/api-gateway) to configure an API Gateway that sends HTTP requests to the Lambda function. 

For more information, see Chapter 3, "How to Deploy Many Apps: Orchestration, VMs, Containers, and Serverless", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
