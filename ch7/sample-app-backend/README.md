# Backend Microservice Example 

This folder contains:

* `app.js`: An Express.js app that pretends to be a "backend" microservice that returns JSON.
* `app.test.js`: Automated integration tests for `app.js`.
* `server.js`: Fires up the app in `app.js` to listen on port 8080.
* `package.json`: An NPM build configuration for the Node.js app.
* `Dockerfile`: Instructions on how to package the Node.js app as a Docker image.
* `kubernetes-config.yml`: Kubernetes configuration for this microservice, including a Deployment, Service,
  Service Account, and Istio authorization policy.

For more information, see Chapter 7, " How to Set Up Networking", of
[_Fundamentals of DevOps and Software Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).
