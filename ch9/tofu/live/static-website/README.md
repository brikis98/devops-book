# Static Website Module 

This folder contains a root OpenTofu module that deploys:

* An S3 bucket configured to host a website.
* A CloudFront distribution as a CDN in front of the S3 bucket.
* Some HTML and image files into the S3 bucket as sample content in the website.

For more information, see Chapter 9, "How to Store Data", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
