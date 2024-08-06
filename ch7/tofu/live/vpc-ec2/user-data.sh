#!/usr/bin/env bash

set -e

my_ip=$(hostname -I)                  
echo "Hello from $my_ip" > index.html 
nohup python3 -m http.server 80 &     