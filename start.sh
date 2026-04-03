#!/bin/bash
cd client && npm run build && cd ..
node server/src/index.js &
npx --prefix client serve -s client/dist -l 5000
