run "deploy" {
  command = apply
}

run "validate" {
  command = apply

  module {
    source = "../test-endpoint"
  }

  variables {
    endpoint = run.deploy.api_endpoint
  }

  assert {
    condition     = data.http.test_endpoint.status_code == 200
    error_message = "Website responded with HTTP status ${data.http.test_endpoint.status_code}"
  }

  assert {
    condition     = data.http.test_endpoint.response_body == "Fundamentals of DevOps!"
    error_message = "Website responded with body ${data.http.test_endpoint.response_body}"
  }
}