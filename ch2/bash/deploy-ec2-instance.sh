#!/usr/bin/env bash

set -e

export AWS_DEFAULT_REGION="us-east-2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
user_data=$(cat "$SCRIPT_DIR/user-data.sh")

security_group_id=$(aws ec2 create-security-group \
  --group-name "sample-app" \
  --description "Allow HTTP traffic into the sample app" \
  --output text \
  --query GroupId)

aws ec2 authorize-security-group-ingress \
  --group-id "$security_group_id" \
  --protocol tcp \
  --port 80 \
  --cidr "0.0.0.0/0" > /dev/null

instance_id=$(aws ec2 run-instances \
  --image-id "ami-0900fe555666598a2" \
  --instance-type "t2.micro" \
  --security-group-ids "$security_group_id" \
  --user-data "$user_data" \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=sample-app}]' \
  --output text \
  --query Instances[0].InstanceId)

public_ip=$(aws ec2 describe-instances \
  --instance-ids "$instance_id" \
  --output text \
  --query 'Reservations[*].Instances[*].PublicIpAddress')

echo "Instance ID = $instance_id"
echo "Security Group ID = $security_group_id"
echo "Public IP = $public_ip"
