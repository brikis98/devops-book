# Serverless Module with RDS Database 

This folder contains a root OpenTofu module that deploys:

* A PostgreSQL DB, using RDS.  
* Schema migrations for the PostgreSQL DB are defined using [Knex.js](https://knexjs.org/) in the `src/migrations` 
  folder and may be applied using the Knex.js CLI.
* A Node.js serverless web app, using AWS Lambda and a Lambda function URL. This app makes queries to the PostgreSQL DB.

For more information, see Chapter 9, "How to Store Data", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
