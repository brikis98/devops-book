# _Fundamentals of DevOps and Software Delivery_ Code

This repo contains the sample code for the book and blog post series [_Fundamentals of DevOps and Software 
Delivery_](https://www.fundamentals-of-devops.com) by Yevgeniy Brikman.

> [!IMPORTANT]  
> This repo contains example code for learning and experimenting only, in conjunction with the book and blog post 
> series. This code is _not_ designed for direct production usage. If you're looking for code you can use directly in
> production, check out the [Gruntwork Library](https://www.gruntwork.io/products/library).

## Quick start

The code samples are organized by chapter (e.g., `ch1`, `ch2`, etc.), and within each chapter, by tool (e.g., `ansible`, 
`kubernetes`, `tofu`). For example, the example Packer template in Chapter 2 will be in the folder `ch2/packer`, and 
the example OpenTofu module called `lambda` in Chapter 3 will be in the folder `ch3/tofu/modules/lambda`.

It's worth noting that most of the examples show you what the code looks like at the _end_ of a chapter. If
you want to maximize your learning, you're better off writing the code yourself, from scratch, and checking the
"official" solutions only at the very end.

## OpenTofu/Terraform modules and the OpenTofu/Terraform Registries

Note that the reusable OpenTofu/Terraform modules from this repo have been published to another repo,
https://github.com/brikis98/terraform-book-devops, so that they can be published to the OpenTofu/Terraform Registries.
This allows you to consume those modules using registry URLs, such as:

```terraform
module "ec2_instance" {
  source  = "brikis98/devops/book//modules/ec2-instance"
  version = "1.0.0"
}
```

Please see https://github.com/brikis98/terraform-book-devops for more details.

## License

This code is released under the MIT License. See [LICENSE.txt](./LICENSE.txt).
