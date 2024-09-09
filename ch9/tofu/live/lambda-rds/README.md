# Serverless Module with RDS Database 

This folder contains a root OpenTofu module that deploys:

* A PostgreSQL DB, using RDS.  
* A Node.js serverless web app, using AWS Lambda and API Gateway. This app makes queries to the PostgreSQL DB. 
* An AWS Lambda function that can run schema migrations on the PostgreSQL DB.

For more information, see Chapter 9, "How to Store Data", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
