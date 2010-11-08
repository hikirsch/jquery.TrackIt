#!/bin/bash

export version=2.2.8

rm -rf ../deploy/*.js 

cp jquery.trackit-header.txt ..\deploy\jquery.trackit.core-%VERSION%.min.js

java -jar yuicompressor-2.4.2.jar ../js/jquery.trackit.core.js --charset utf-8 >> ../deploy/jquery.trackit.core-%VERSION%.min.js 
java -jar yuicompressor-2.4.2.jar ../js/jquery.trackit.modules.js -o ../deploy/jquery.trackit.modules-%VERSION%.min.js --charset utf-8
java -jar yuicompressor-2.4.2.jar ../js/jquery.trackit.plugins.js -o ../deploy/jquery.trackit.plugins-%VERSION%.min.js --charset utf-8

cp ../deploy/*.js ../deploy/jquery.trackit-$VERSION.min.js
cp ../js/*.js ../deploy/jquery.trackit-$VERSION.dev.js
