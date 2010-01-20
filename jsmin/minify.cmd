@ECHO OFF

del ..\deploy\*.js 

copy jquery.trackit-header.txt ..\deploy\jquery.trackit.core-2.0.min.js

java -jar yuicompressor-2.4.2.jar ..\js\jquery.trackit.core.js --charset utf-8 >> ..\deploy\jquery.trackit.core-2.0.min.js 
java -jar yuicompressor-2.4.2.jar ..\js\jquery.trackit.modules.js -o ..\deploy\jquery.trackit.modules-2.0.min.js --charset utf-8
java -jar yuicompressor-2.4.2.jar ..\js\jquery.trackit.plugins.js -o ..\deploy\jquery.trackit.plugins-2.0.min.js --charset utf-8

copy /b ..\deploy\*.js ..\deploy\jquery.trackit-2.0.min.js