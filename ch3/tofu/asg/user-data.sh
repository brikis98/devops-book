#!/usr/bin/env bash

set -e

sudo su app-user         
cd /home/app-user        
pm2 start app.config.js  
pm2 save                 