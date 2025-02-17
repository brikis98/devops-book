# Container Orchestration Module

This folder, along with [ecr-sample](../ecr-sample) and the [kubernetes objects](../../../kubernetes), contain an 
example of container orchestration. This folder contains a root OpenTofu module that uses the 
[eks-cluster](../../modules/eks-cluster) module to create an EKS cluster with a managed node group.

For more information, see Chapter 3, "How to Manage Your Apps Using Orchestration Tools", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
