resource "aws_kms_key" "key" {
  key_usage = "ENCRYPT_DECRYPT"
  policy    = data.aws_iam_policy_document.key_policy.json
}

data "aws_iam_policy_document" "key_policy" {
  # Grant admins full management rights to the key, but no usage rights
  statement {
    sid       = "KeyAdministrator"
    effect    = "Allow"
    resources = ["*"]
    actions = [
      "kms:Create*",
      "kms:Describe*",
      "kms:Enable*",
      "kms:List*",
      "kms:Put*",
      "kms:Update*",
      "kms:Revoke*",
      "kms:Disable*",
      "kms:Get*",
      "kms:Delete*",
      "kms:ScheduleKeyDeletion",
      "kms:CancelKeyDeletion",
      "kms:Tag*",
      "kms:Untag*",
      "kms:ReplicateKey"
    ]
    principals {
      type        = "AWS"
      identifiers = concat([data.aws_caller_identity.current.arn], var.administrator_iam_arns)
    }
  }

  # Grant users full encrypt/decrypt rights to the key, but no management rights
  statement {
    sid       = "KeyUser"
    effect    = "Allow"
    resources = ["*"]
    actions = [
      "kms:CreateGrant",
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey",
      "kms:GetPublicKey"
    ]
    principals {
      type        = "AWS"
      identifiers = concat([data.aws_caller_identity.current.arn], var.user_iam_arns)
    }
  }

  # If allow_managing_key_with_iam_policies is true, allow this key to be managed with IAM policies
  dynamic "statement" {
    for_each = var.allow_managing_key_with_iam_policies ? ["once"] : []
    content {
      sid       = "AllowManagingKeyWithIamPolicies"
      effect    = "Allow"
      resources = ["*"]
      actions   = ["kms:*"]

      principals {
        type        = "AWS"
        identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
      }
    }
  }
}

resource "aws_kms_alias" "key" {
  name          = "alias/${var.name}"
  target_key_id = aws_kms_key.key.id
}

data "aws_caller_identity" "current" {}
