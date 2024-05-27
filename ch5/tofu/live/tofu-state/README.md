# OpenTofu State Module 

This folder contains a root OpenTofu module that uses the [state-bucket](../../modules/state-bucket) module to create 
an S3 bucket and DynamoDB table that can be used for storing OpenTofu state.

For more information, see Chapter 5, "How to Set Up Continuous Integration (CI) and Continuous Delivery (CD)", of 
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
