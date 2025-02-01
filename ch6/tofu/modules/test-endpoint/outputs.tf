output "http_response" {
  description = "The HTTP response. Has all the attributes of the http data source (https://registry.terraform.io/providers/hashicorp/http/latest/docs/data-sources/http)."
  value       = data.http.test_endpoint
}