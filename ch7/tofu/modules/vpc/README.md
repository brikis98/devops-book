# VPC Module

This folder contains a reusable OpenTofu module that can create the following:

1. A VPC.
2. An Internet Gateway.
3. A public subnet and route table, with a route to the Internet Gateway.
4. A private subnet and route table.

For more information, see Chapter 7, " How to Set Up Networking", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
