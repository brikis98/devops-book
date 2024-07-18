# Child Accounts Module 

This folder contains a root OpenTofu module that uses the [aws-organizations module](../../modules/aws-organizations)
to create three child AWS accounts: development, staging, and production. 

For more information, see Chapter 6, "How to Work with Multiple Teams and Environments", of 
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
