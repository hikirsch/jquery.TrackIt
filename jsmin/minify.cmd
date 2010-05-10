@ECHO OFF

set version=2.2.3

del ..\deploy\*.js 

copy jquery.trackit-header.txt ..\deploy\jquery.trackit.core-%VERSION%.min.js

java -jar yuicompressor-2.4.2.jar ..\js\jquery.trackit.core.js --charset utf-8 >> ..\deploy\jquery.trackit.core-%VERSION%.min.js 
java -jar yuicompressor-2.4.2.jar ..\js\jquery.trackit.modules.js -o ..\deploy\jquery.trackit.modules-%VERSION%.min.js --charset utf-8
java -jar yuicompressor-2.4.2.jar ..\js\jquery.trackit.plugins.js -o ..\deploy\jquery.trackit.plugins-%VERSION%.min.js --charset utf-8

copy /b ..\deploy\*.js ..\deploy\jquery.trackit-%VERSION%.min.js
copy /b ..\js\*.js ..\deploy\jquery.trackit-%VERSION%.dev.js