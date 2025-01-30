# KMS Key Module 

This folder contains a reusable OpenTofu module that can create a key in AWS KMS, configure admins (full management
rights, but no usage rights) and users (full encrypt/decrypt rights, but no management rights) for the key, and
create an alias for the key. Note that the user that runs `apply` on this module is always added as both an admin and
a user.

For more information, see Chapter 5, "How to Set Up Continuous Integration (CI) and Continuous Delivery (CD)", of 
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
