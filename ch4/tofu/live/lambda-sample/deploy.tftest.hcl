run "deploy" {   
  command = apply
}

run "validate" { 
  command = apply

  module {       
    source  = "brikis98/devops/book//modules/test-endpoint"
    version = "1.0.0"
  }

  variables {    
    endpoint = run.deploy.function_url
  }

  assert {       
    condition     = data.http.test_endpoint.status_code == 200
    error_message = "Unexpected status: ${data.http.test_endpoint.status_code}"
  }

  assert {       
    condition     = data.http.test_endpoint.response_body == "Hello, World!"
    error_message = "Unexpected body: ${data.http.test_endpoint.response_body}"
  }
}