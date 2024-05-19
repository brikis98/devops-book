provider "aws" {
  region = "us-east-2"
}

resource "aws_lambda_function" "function" {
  function_name = "sample-app-lambda"     
  role          = aws_iam_role.lambda.arn 

  
  package_type     = "Zip"
  filename         = data.archive_file.source_code.output_path
  source_code_hash = data.archive_file.source_code.output_base64sha256

  runtime = "nodejs20.x"      
  handler = "index.handler"   

  memory_size = 128           
  timeout     = 5             

  environment {               
    variables = {
      NODE_ENV = "production"
    }
  }
}

data "archive_file" "source_code" {
  type        = "zip"
  source_dir  = "${path.module}/src"
  output_path = "${path.module}/sample-app-lambda.zip"
}

resource "aws_iam_role" "lambda" {
  name               = "sample-app-lambda"
  assume_role_policy = data.aws_iam_policy_document.policy.json
}

data "aws_iam_policy_document" "policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_apigatewayv2_api" "api" {
  name          = "sample-app-lambda"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.function.arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "lambda_route" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "allow_invoke" {
  statement_id  = "AllowAPIGatewayToCallSampleAppLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.function.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/GET/"
}
