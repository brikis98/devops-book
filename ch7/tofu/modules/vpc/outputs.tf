output "vpc" {
  description = "All the data on the VPC"
  value       = aws_vpc.vpc
}

output "public_subnet" {
  description = "All the data on the public subnet"
  value       = aws_subnet.public
}

output "private_subnet" {
  description = "All the data on the private subnet"
  value       = aws_subnet.private
}

output "public_route_table" {
  description = "All the data on the public route table"
  value       = aws_route_table.public
}

output "private_route_table" {
  description = "All the data on the private route table"
  value       = aws_route_table.private
}