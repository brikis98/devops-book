resource "aws_lambda_function" "function" {
  function_name = var.name
  role          = aws_iam_role.lambda.arn

  package_type     = "Zip"
  filename         = data.archive_file.source_code.output_path
  source_code_hash = data.archive_file.source_code.output_base64sha256

  runtime = var.runtime
  handler = var.handler

  memory_size = var.memory_size
  timeout     = var.timeout

  environment {
    variables = var.environment_variables
  }
}

data "archive_file" "source_code" {
  type        = "zip"
  source_dir  = var.src_dir
  output_path = "${path.module}/${var.name}.zip"
}

resource "aws_iam_role" "lambda" {
  name               = var.name
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

resource "aws_iam_role_policy" "allow_logging" {
  name   = "${var.name}-allow-logging"
  role   = aws_iam_role.lambda.name
  policy = data.aws_iam_policy_document.allow_logging.json
}

data "aws_iam_policy_document" "allow_logging" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}
