# Serverless Module with Automated Tests 

This folder contains: 

* `*.tf` files: A root OpenTofu module that deploys a Node.js "Hello, World" serverless app using AWS Lambda and a 
  Lambda function URL.
* `deploy.tftest.hcl`: An automated tests that uses the `tofu test` command to validate the serverless app works as
  expected

For more information, see Chapter 4, "How to Version, Build, and Test Your Code", of [_Fundamentals of DevOps and 
Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
