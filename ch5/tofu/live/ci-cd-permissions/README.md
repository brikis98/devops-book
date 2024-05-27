# CI/CD Permissions Module 

This folder contains a root OpenTofu module that can be used to set up permissions for doing CI/CD with GitHub Actions,
AWS, and OpenTofu. This module uses the [github-aws-oidc](../../modules/github-aws-oidc) module to configure GitHub as
an OIDC provider in AWS and the [gh-actions-iam-roles](../../modules/gh-actions-iam-roles) module to create IAM roles
in AWS that you can assume from GitHub Actions workflows (using OIDC) to run automated tests, `tofu plan`, and 
`tofu apply`.

For more information, see Chapter 5, "How to Set Up Continuous Integration (CI) and Continuous Delivery (CD)", of 
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
