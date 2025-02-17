#!/usr/bin/env bash

set -e

setcap 'cap_net_bind_service=+ep' "$(readlink -f "$(which node)")" 

su app-user <<'EOF'
cd /home/app-user/sample-app
pm2 start app.config.js
pm2 save
EOF