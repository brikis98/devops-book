# GitHub Actions CI/CD Workflows 

This folder contains: 

* `app-tests.yml`: A GitHub Actions workflow to run the automated tests of a Node.js "Hello, World" app.
* `infra-tests.yml`: A GitHub Actions workflow to run the automated tests for an OpenTofu  module.
* `tofu-plan.yml`: A GitHub Actions workflow that runs on PRs that modify an OpenTofu module. This workflow runs 
  `tofu plan` on the module and posts the plan output as a comment in the PR.
* `tofu-apply.yml`: A GitHub Actions workflow that runs on merged PRs that modify an OpenTofu module. This workflow runs 
  `tofu apply` on the module and posts the apply output as a comment in the PR.

For more information, see Chapter 5, "How to Set Up Continuous Integration (CI) and Continuous Delivery (CD)", of 
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
