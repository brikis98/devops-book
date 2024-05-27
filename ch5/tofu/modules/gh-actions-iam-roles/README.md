# GitHub Actions IAM Roles Module 

This folder contains a reusable OpenTofu module that can create three IAM roles that can be assumed from GitHub Actions
workflows using OIDC:

* An IAM role for running automated tests against the `lambda-sample` module on any branch.
* An IAM role for running `tofu plan` against the `lambda-sample` module on any branch.
* An IAM role for running `tofu apply` against the `lambda-sample` module on the `main` branch only.

For more information, see Chapter 5, "How to Set Up Continuous Integration (CI) and Continuous Delivery (CD)", of 
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
