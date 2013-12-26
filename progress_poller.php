<?php
	$file = escapeshellarg('C:/wamp/www/inputs/'.$_POST['progress_file_id'].'.txt');
	echo trim(`C:/wamp/UnxUtils/usr/local/wbin/tail.exe -n 1 $file`);
	die();
?>