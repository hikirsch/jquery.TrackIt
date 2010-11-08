#!/bin/bash

export VERSION=2.2.8

rm -rf ../deploy/*.js 

cp -v jquery.trackit-header.txt ../deploy/jquery.trackit.core-$VERSION.min.js

java -jar yuicompressor-2.4.2.jar ../js/jquery.trackit.core.js --charset utf-8 >> ../deploy/jquery.trackit.core-$VERSION.min.js 
java -jar yuicompressor-2.4.2.jar ../js/jquery.trackit.modules.js -o ../deploy/jquery.trackit.modules-$VERSION.min.js --charset utf-8
java -jar yuicompressor-2.4.2.jar ../js/jquery.trackit.plugins.js -o ../deploy/jquery.trackit.plugins-$VERSION.min.js --charset utf-8

cat ../deploy/*.js >> ../deploy/jquery.trackit-$VERSION.min.js
cat ../js/*.js >> ../deploy/jquery.trackit-$VERSION.dev.js
