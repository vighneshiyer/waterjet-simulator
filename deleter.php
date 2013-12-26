<?php
sleep('3');
$progress_id = $_GET['progress_id'];
$number = $_GET['number'];

$files = glob('C:/wamp/www/inputs/input'.$number.'/*'); // get all file names
foreach($files as $file){ // iterate files
  if(is_file($file))
    unlink($file); // delete file
}
rmdir('C:/wamp/www/inputs/input'.$number);
unlink('C:/wamp/www/inputs/'.$progress_id.'.txt');
ob_clean();
die();
?>