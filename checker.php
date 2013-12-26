<?php
	$data = $_POST['data'];
	$output_int = filter_var($data, FILTER_VALIDATE_INT);
	$output_float = filter_var($data, FILTER_VALIDATE_FLOAT);
	if(($output_int === false) && ($output_float === false)){
		echo "false";
	}
	else {
		echo "true";
	}	
?>