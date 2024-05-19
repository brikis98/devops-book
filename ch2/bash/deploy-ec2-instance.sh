#!/usr/bin/env bash

set -e

# The AWS region to use. The AWS CLI should pick up this env var automatically.
export AWS_DEFAULT_REGION="us-east-2"
# Get the dir where this script is located
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Creating security group"
security_group_id=$(aws ec2 create-security-group \
  --group-name "sample-app-script" \
  --description "Allow HTTP traffic into the sample app" \
  --output text \
  --query GroupId)

echo "Adding rule to allow inbound requests on port 80 to security group"
aws ec2 authorize-security-group-ingress \
  --group-id "$security_group_id" \
  --protocol tcp \
  --port 80 \
  --cidr "0.0.0.0/0" > /dev/null

echo "Reading user data script from chapter 1"
user_data=$(cat "$SCRIPT_DIR/../../ch-1-how-to-deploy-your-app/ec2-user-data-script/user-data.sh")

echo "Creating EC2 instance with Amazon Linux 2003 AMI"
instance_id=$(aws ec2 run-instances \
  --image-id "ami-0900fe555666598a2" \
  --instance-type "t2.micro" \
  --security-group-ids "$security_group_id" \
  --user-data "$user_data" \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=sample-app-script}]' \
  --output text \
  --query Instances[0].InstanceId)

echo "Getting public IP address of EC2 instance"
public_ip=$(aws ec2 describe-instances \
  --instance-ids "$instance_id" \
  --output text \
  --query 'Reservations[*].Instances[*].PublicIpAddress')

echo
echo "Done!"
echo

echo "Instance ID = $instance_id"
echo "Security Group ID = $security_group_id"
echo "Public IP = $public_ip"
