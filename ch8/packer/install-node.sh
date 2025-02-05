#!/usr/bin/env bash

set -e

sudo tee /etc/yum.repos.d/nodesource-nodejs.repo > /dev/null <<EOF
[nodesource-nodejs]
baseurl=https://rpm.nodesource.com/pub_23.x/nodistro/nodejs/x86_64
gpgkey=https://rpm.nodesource.com/gpgkey/ns-operations-public.key
EOF
sudo yum install -y nodejs

sudo adduser app-user
sudo mv /tmp/sample-app /home/app-user
sudo npm ci --only=production --prefix /home/app-user/sample-app 
sudo chown -R app-user /home/app-user/sample-app
sudo npm install pm2@latest -g
eval "$(sudo su app-user bash -c 'pm2 startup' | tail -n1)"
