#!/bin/bash

npx @hauke5/utils@latest
cp -R $(dirname $0)/../@hauke5/nextjs-utils/dist/lib ./
cp -R $(dirname $0)/../@hauke5/nextjs-utils/dist/app ./
