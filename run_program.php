<?php
register_shutdown_function('handleShutdown');

$INPUT_PATH = 'C:/wamp/www/inputs/';

function microtime_float()
{
    list($usec, $sec) = explode(" ", microtime());
    return ((float)$usec + (float)$sec);
}
$time_start = microtime_float();

function handleShutdown() {
	global $time_out;
	if($time_out === TRUE){
		ob_clean();
        encode_JSON(null, null, FALSE, NULL, '<div class="red">If this message took 60 seconds to pop up, timeout error. Try increasing the interval.</div>', NULL);
	}
}

function encode_JSON($output, $csv_url, $success, $number, $message, $time) {
	ob_clean();
	echo json_encode(array('output' => $output, 'csv_url' => $csv_url, 'success' => $success, 'number' => $number, 'message' => $message, 'time' => $time));
}

//For each function pass an array $arr[0] = parameter_name $arr[1] = parameter_value
class Validate{
	static function isNotEmpty($input_data){
		if($input_data[0] === "TILT_ANGLE"){
			return true;
		}
		if(!empty($input_data['1'])){
			return true;
		}
		else{
			encode_JSON(null, null, FALSE, null,'<div class="red">'.$input_data['0'].' is empty.</div>', NULL);
			$time_out = FALSE;
			die();
		}
	}
	
	
	static function isFloatOrInt($input_data){
		if($input_data[0] === "TILT_ANGLE" && $input_data[1] === 0){
			return true;
		}
		if(is_numeric($input_data[1]) || is_float($input_data[1])){
			return true;
		}
		else{
			encode_JSON(null, null, FALSE, null,'<div class="red">'.$input_data[0].' is not a number.</div>', NULL);
			$time_out = FALSE;
			die();
		}
	}
	
	static function isGreaterThanZero($input_data){
		if($input_data[0] === "TILT_ANGLE"){
			return true;
		}
		if($input_data[1] > 0){
			return true;
		}
		else{
			encode_JSON(NULL, NULL, FALSE, NULL, '<div class="red">'.$input_data[0].' is less than zero.</div>', NULL);
			$time_out = FALSE;
			die();
		}
	}
}

$data = $_POST['f_data'];
$pressure_min = $_POST['min_pressure'];
$pressure_max = $_POST['max_pressure'];
$interval = $_POST['interval'];

//DATA VALIDATION
Validate::isNotEmpty(array('Form data', $data)); //If the data input is empty, terminate the script and output an error message

$params = explode('&', $data); //explode the data into an array of strings (NOZZLE_DIAMETER=x)

foreach($params as $key => $value){ //for every string as above
	$str = explode('=', $value);//explode the string and get (NOZZLE_DIAMETER, x)
	Validate::isNotEmpty($str);
	Validate::isFloatOrInt($str);
	Validate::isGreaterThanZero($str);
}

Validate::isNotEmpty(array("Minimum pressure", $pressure_min));
Validate::isNotEmpty(array("Maximum pressure", $pressure_max));
Validate::isFloatOrInt(array("Minimum pressure", $pressure_min));
Validate::isFloatOrInt(array("Maximum pressure", $pressure_max));
Validate::isGreaterThanZero(array("Minimum pressure", $pressure_min));
Validate::isGreaterThanZero(array("Maximum pressure", $pressure_max));

if($pressure_min > $pressure_max){ //If the $pressure_min is greater than the $pressure_max, terminate the script
	encode_JSON(NULL, NULL, FALSE, NULL,'<div class="red">The minimum pressure must be less than the maximum pressure</div>', NULL);
	die();
}
	
Validate::isNotEmpty(array("Interval", $interval));
$interval_int = filter_var($interval, FILTER_VALIDATE_INT);
if(($interval_int === false)){ //if $interval is not an int, terminate the script
	encode_JSON(NULL, NULL, FALSE, NULL,'<div class="red">Enter valid interval; must be an integer above 0.</div>', NULL);
	die();
}
Validate::isGreaterThanZero(array("Interval", $interval));
	
//GET the name of the folder to create
$line =  trim(`C:/wamp/UnxUtils/usr/local/wbin/tail.exe -n 1 C:/wamp/www/file_numbers.txt`);
$new_file_number = (int)$line + 1;
$number_file = fopen('C:/wamp/www/file_numbers.txt', 'a+'); //Write the new number to the file
fwrite($number_file, PHP_EOL.$new_file_number);
fclose($number_file); //Close the file
unset($line, $number_file);

//Open the file that will deliver progress messages to the user
$progress_file = fopen($INPUT_PATH.$_POST['progress_id'].'.txt', "w");

//Set the variables to control the new folder path
$new_folder_path = $INPUT_PATH.'input'.$new_file_number;
$number_of_items = (($pressure_max - $pressure_min) / $interval) + 1;

//Copy the program files to the working directory
mkdir($new_folder_path);
copy('C:\wamp\www\program_files\energy.exe', $new_folder_path.'/energy.exe');
copy('C:\wamp\www\program_files\libgcc_s_dw2-1.dll', $new_folder_path.'/libgcc_s_dw2-1.dll');
copy('C:\wamp\www\program_files\libgfortran-3.dll', $new_folder_path.'/libgfortran-3.dll');

$output_array = array(); //Create an array to hold the output values
$time_out = TRUE; //If program does time out, it will be after this point

//For each pressure, taking into account the interval
for($i = $pressure_min; $i <= $pressure_max; $i += $interval){
	
	$input_file = fopen($new_folder_path.'/waterjet.inp', 'w'); //Open the file to which inputs will be written
	fwrite($input_file, "&WATERJET_INPUT".PHP_EOL); //Write the input header
	foreach($params as $key => $value){ //For every parameter entered
		fwrite($input_file, $value.PHP_EOL); //Write the individual input parameters
	}
		
	fwrite($input_file, "PRESSURE=$i".PHP_EOL.'nz_focussing_tube=180'.PHP_EOL.'case_name_tag="waterjet"'.PHP_EOL.'/'.PHP_EOL); //Write the pressure and the model parameters
	fclose($input_file); //Close the input file
	chdir($new_folder_path);
	`energy.exe &`; //Run the energy.exe program and background the program
	
	$waterjet_output = fopen('waterjet_energy_flux.dat', 'r'); //Open the output file from energy.exe
	if($waterjet_output === false){
		$time_out = false;
		encode_JSON(NULL, NULL, FALSE,$new_file_number,'<div class="red">Internal error. Check inputs and make sure values are entered correctly and are reasonable.</div>', NULL);
		die();
	}
	$output_line = trim(fgets($waterjet_output)); //Get a line from the output file and trim it
	$output_array[(double)$i] = (double)$output_line; //Write the output value to the output array

	fclose($waterjet_output);

	$percentage = (int)round(((($i - $pressure_min) / $interval) / $number_of_items)*100);
	fwrite($progress_file, $percentage.PHP_EOL);	
}
fwrite($progress_file, '100');
fclose($progress_file);

$csv_file = fopen($INPUT_PATH.$new_file_number.'.csv', 'w');
fwrite($csv_file, 'Pressure (Pa),Energy Flux (W)'.PHP_EOL);
foreach($output_array as $key => $value){
	fwrite($csv_file, $key.','.$value.PHP_EOL);
}
fclose($csv_file);
	
$time_out = FALSE;
$time_end = microtime_float();
$time = $time_end - $time_start;
encode_JSON($output_array, '/inputs/'.$new_file_number.'.csv', TRUE, $new_file_number, '<div>Data fetched.</div>', '<div>Execution time: '.$time.'</div>');
die();
?>