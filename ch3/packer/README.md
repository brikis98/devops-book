# Node.js App Packer Template

This folder contains:

* `app.js`: A Node.js "Hello, World" app that listens on port 8080.
* `app.config.js`: A config file for running the Node.js sample app using PM2 as a process supervisor.
* `sample-app.pkr.hcl`: A Packer template for creating an AMI for the Node.js sample app.

For more information, see Chapter 3, "How to Manage Your Apps Using Orchestration Tools", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
