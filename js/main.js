$(window).load(function(){
	//Set wrapper offset
	var header_height = document.getElementById("header").offsetHeight;
	$('#wrapper').css("top", header_height);
});

$(document).ready(function() {
//When clicking on an input box, highlight the input
$('input').focus(function() {
	this.select();
});

$('#result').resize(function(){
	var header_height = document.getElementById("header").offsetHeight;
	$('#wrapper').css("top", header_height);
});

//When hovering over a form item, highlight it
$('.formitem').hover(function() {
	$(this).addClass('formfield_hover');
}, function() {
	$(this).removeClass('formfield_hover');
});

//jQuery progressbar for result
$('#result_progressbar').progressbar({
	value:0
});

//Popup a modal when help button clicked
$("#top_bar_help").leanModal({ top : 200, overlay : 0.7, closeButton: ".modal_close" });

//Validation using js
$('.formfield').each(function(index,element) {
	var ID = this.id;
	var set = new LiveValidation(ID, {validMessage:" "});
	set.add(Validate.Presence, {failureMessage: " "});
	set.add(Validate.Numericality, {minimum:0, failureMessage: " ", notANumberMessage: " ", tooLowMessage: " "});
});

var set = new LiveValidation('INTERVAL', {validMessage:" "});
set.add(Validate.Presence, {failureMessage: " "});
set.add(Validate.Numericality, {minimum:1, onlyInteger:true, failureMessage: " ", notANumberMessage: " ", tooLowMessage: " ", notAnIntegerMessage: " "});

var set = new LiveValidation('PRESSURE_MAX', {validMessage:" "});
set.add(Validate.Presence, {failureMessage: " "});
set.add(Validate.Numericality, {minimum:1, failureMessage: " ", notANumberMessage: " ", tooLowMessage: " "});

var set = new LiveValidation('PRESSURE_MIN', {validMessage:" "});
set.add(Validate.Presence, {failureMessage: " "});
set.add(Validate.Numericality, {minimum:1, failureMessage: " ", notANumberMessage: " ", tooLowMessage: " "});

//Do NOT cache AJAX
$.ajaxSetup({
	cache: false
});

//random string generator for the progress file id
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

//When Calculate is clicked, check each field, and run the js validation, then the AJAX server validation
//If successful, send a request to the server
var loadURL = "run_program.php";
$('#execute').click(function(event) {
	
	//Prepare for new data
	hideCalculate();
	$('#result_progressbar').progressbar('value', 0);
	event.preventDefault();
    $('#result_text').empty();
    $('#result_text').html('Calculating energy flux...');
    $('#csv_download').css("display", "none");
	$('#csv_download').attr("onClick", "");
    
    //Set up data to send to server
	var form_data = $('#input_form .formfield').serialize();
	var send_min_pressure = $('#PRESSURE_MIN').val().toString();
	var send_max_pressure = $('#PRESSURE_MAX').val().toString();
	var send_interval = $('#INTERVAL').val().toString();
	var id = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
	var progress_loop;
	
	$.post(loadURL, { f_data:form_data, min_pressure:send_min_pressure, max_pressure:send_max_pressure, interval:send_interval, progress_id:id }, function (result) {
		clearTimeout(progress_loop);
		$('#result_progressbar .ui-progressbar-value').animate({width:'100%'}, {queue:false, duration:100});
		
		try{var parsedJSON = jQuery.parseJSON(result);}
		catch(e){alert('Internal problem. Make sure the inputs are valid and reasonable.'); showCalculate(); $('#result_text').html('Click calculate to begin processing'); return false;}
		finally{$.get('deleter.php', {progress_id:id, number:parsedJSON.number});}

		showCalculate();
		$('#result_text').html(parsedJSON.message);
		$('#result_text').append(parsedJSON.time);
		
		generateSeries(parsedJSON);
		if(parsedJSON.success === true){
			$('#csv_download').css("display", "inline");
			$('#csv_download').attr("onClick", "window.location.href = '"+parsedJSON.csv_url+"'");
		}
	});
	$('#result_progressbar .ui-progressbar-value').css('display', 'block');
	(function loop(){
		progress_loop = setTimeout(loop, 1500);
	   	$.post("progress_poller.php", {progress_file_id:id}, function(result){
			$('#result_progressbar .ui-progressbar-value').animate({width:result+'%'}, {queue:false, duration:100, easing:'linear'});
		});
	}())
});

function showCalculate() {
	$('#execute').show();
	$('#reset_defaults').css("marginLeft", "10px");
}

function hideCalculate() {
	$('#execute').hide();
	$('#reset_defaults').css("margin", "0");
}

//Graphing with flot
var points = [];
var options = {
		series: {
			lines: { show: true },
			points: { show: true },
			color:"rgb(200,0,0)",
			label:"Pressure vs. Energy Flux",
			data:points
		},
		xaxes:[{
            axisLabel: 'Pressure (MPa)'
        }],
        yaxes:[{
            axisLabel: 'Energy Flux (W)'
        }],
        grid: {
        	hoverable:true
        },
        zoom: {
        	interactive:true
        },
        pan: {
        	interactive:true
        }
};
var pressure_flux_plot = $.plot($("#pressure_flux_graph"), [ points ], options);
var series;
function generateSeries(data){
	if(data.success === false){
		return false;
	}
	points.length = 0;
	$.each(data.output, function(indexInArray, valueOfElement){
		points.push([indexInArray/1000000, valueOfElement]);
	});
	series = {
		data:points,
		color:"rgb(200,0,0)",
		label:"Pressure vs. Energy Flux"
	};
	pressure_flux_plot = $.plot($("#pressure_flux_graph"), [ series ], options);
	console.log(points);
}

$('#graph_reset').click(function(){
	pressure_flux_plot = $.plot($("#pressure_flux_graph"), [ points ], options);
});

function showTooltip(x, y, contents) {
        $('<div id="tooltip">' + contents + '</div>').css( {
            position: 'absolute',
            display: 'none',
            top: y + 7,
            left: x + 7,
            border: '1px solid #fdd',
            padding: '2px',
            'background-color': '#fff',
            opacity: 0.80
        }).appendTo("body").fadeIn(200);
}

var previousPoint = null;
$("#pressure_flux_graph").bind("plothover", function (event, pos, item) {
	$("#x").text(pos.x.toFixed(2));
	$("#y").text(pos.y.toFixed(2));
	if (item) {
		if (previousPoint != item.dataIndex) {
			previousPoint = item.dataIndex;        
			$("#tooltip").remove();
			var x = item.datapoint[0].toFixed(2), y = item.datapoint[1].toFixed(2);
			showTooltip(item.pageX, item.pageY, x + " MPa, " + y + " W");
		}
	}
	else {
		$("#tooltip").remove();
		previousPoint = null;            
	}
});

//Set the Object to its default value
function default_set(object) {
	var def = $(object).parent().children('.formfield').attr('data');
	$(object).parent().children('.formfield').val(def).siblings('span').remove();
}

function default_set_pressures() {
	$('#PRESSURE_MIN').val($('#PRESSURE_MIN').attr('data'));
	$('#PRESSURE_MAX').val($('#PRESSURE_MAX').attr('data'));
	$('#PRESSURE_MIN').siblings('span.LV_invalid').remove();
	$('#PRESSURE_MAX').siblings('span.LV_invalid').remove();
}

$('#PRESSURE_LABEL').click(function(){
	default_set_pressures();
});

$('#INTERVAL_LABEL').click(function(){
	$('#INTERVAL').val($('#INTERVAL').attr('data'));
});

$('label').click(function(eventObject) {
	default_set(this);
});

$('#reset_defaults').click(function(event) {
	event.preventDefault();
	$('label').each(function(index, domElement) {
		default_set(this);
	});
	default_set_pressures();
	$('#INTERVAL').val($('#INTERVAL').attr('data'));
});

/*3D Code
 * Three.js
 * 
 */
//declare global variables
var container, raw_container, camera, controls, scene, renderer, light;
var cylinder_tube, cylinder_mix, cylinder_nozzle, cylinder_pipe;
var tube_length, tube_diameter, mix_diameter, mix_length, pipe_length, pipe_diameter, nozzle_diameter, nozzle_height;
container = $('#draw_box');
raw_container = document.getElementById('draw_box');
var multiplier = 4000;

init();
animate();

function init(){
	//scene and camera
	scene = new THREE.Scene();
	var WIDTH = $('#draw_box').width(),
	HEIGHT = $('#draw_box').height();
	
	camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 10000);
	camera.position.z = 500;
	camera.position.y = 500;
	scene.add(camera);
	
	//renderer
	renderer = new THREE.WebGLRenderer({antialias:true, precision:"highp"});
	renderer.setSize(WIDTH, HEIGHT);
	
	controls = new THREE.TrackballControls(camera, renderer.domElement);
	
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	
	controls.noRotate = false;
	controls.noZoom = false;
	controls.noPan = false;
	
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
		
	controls.addEventListener('change', render);
	
	//world
	tube_length = Math.ceil(($('#TUBE_LENGTH').val())*multiplier);
	tube_diameter = Math.ceil(($('#TUBE_DIAMETER').val())*multiplier);
	mix_diameter = Math.ceil(($('#MIXING_CHAMBER_DIAMETER').val())*multiplier);
	mix_length = Math.ceil(($('#MIXING_CHAMBER_LENGTH').val())*multiplier);
	pipe_length = Math.ceil(($('#PIPE_LENGTH').val())*multiplier);
	pipe_diameter = Math.ceil(($('#PIPE_DIAMETER').val())*multiplier);
	nozzle_diameter = Math.ceil(($('#NOZZLE_DIAMETER').val())*multiplier);
	nozzle_height = 0.01*multiplier;

	//materials
	var tubeMaterial = new THREE.MeshLambertMaterial({color: 0xFF0000});
	var mixMaterial = new THREE.MeshLambertMaterial({color: 0x00FF00});
	var nozzleMaterial = new THREE.MeshLambertMaterial({color: 0x888888});
	var pipeMaterial = new THREE.MeshLambertMaterial({color: 0x0000FF});

	cylinder_tube = new THREE.Mesh(new THREE.CylinderGeometry(tube_diameter,tube_diameter,tube_length,300),tubeMaterial);
	cylinder_tube.geometry.dynamic = true;
	cylinder_tube.geometry.verticesNeedUpdate = true;
	cylinder_tube.geometry.normalsNeedUpdate = true;
	
	cylinder_mix = new THREE.Mesh(new THREE.CylinderGeometry(mix_diameter, mix_diameter, mix_length, 300), mixMaterial);
	cylinder_mix.geometry.dynamic = true;
	cylinder_mix.geometry.verticesNeedUpdate = true;
	cylinder_mix.geometry.normalsNeedUpdate = true;
	cylinder_mix.position.y = tube_length/2 + mix_length/2;
	
	cylinder_nozzle = new THREE.Mesh(new THREE.CylinderGeometry(nozzle_diameter, nozzle_diameter, nozzle_height, 300), nozzleMaterial);
	cylinder_nozzle.geometry.dynamic = true;
	cylinder_nozzle.geometry.verticesNeedUpdate = true;
	cylinder_nozzle.geometry.normalsNeedUpdate = true;
	cylinder_nozzle.position.y = tube_length/2 + mix_length + nozzle_height/2;
	
	cylinder_pipe = new THREE.Mesh(new THREE.CylinderGeometry(pipe_diameter, pipe_diameter, pipe_length, 300), pipeMaterial);
	cylinder_pipe.rotation.z = Math.PI/2;
	cylinder_pipe.geometry.dynamic = true;
	cylinder_pipe.geometry.verticesNeedUpdate = true;
	cylinder_pipe.geometry.normalsNeedUpdate = true;
	cylinder_pipe.position.y = tube_length/2 + mix_length/2;
	cylinder_pipe.position.x = pipe_length/2 + mix_diameter;
	
	scene.add(cylinder_tube);
	scene.add(cylinder_mix);
	scene.add(cylinder_nozzle);
	scene.add(cylinder_pipe);
	
	//lights
	light = new THREE.AmbientLight(0x000000);
	scene.add(light);
	
	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 );
	scene.add(light);
	
	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( -1, -1, -1 );
	scene.add(light);
	
	/*light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( -1, 1, 1 );
	scene.add(light);
	
	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, -1 );
	scene.add(light);*/
	
	controls.target = new THREE.Vector3(0,tube_length/2 + mix_length/2,0);

	container.empty();
	container.append(renderer.domElement);
}

// shim layer with setTimeout fallback
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
    })();

function animate() {
	requestAnimationFrame(animate);
	controls.update();
}

function render(){
	renderer.render(scene, camera);
}

$('.geofield').blur(function(){
	init();
})

var expanded = false;	
//Expand drawing canvas to full screen
$('#draw_expand_button').click(function(){
	if(expanded === false){
		$('html').css("height", '100%');
		$('body').css("height", '100%');
		$('#col2').addClass('col2_expand');
		$('#col1').addClass('col1_expand');
		$('#draw_controls').addClass('draw_controls_expand');
		$('#wrapper').addClass('wrapper_expand');
		$('#draw_box').addClass('draw_box_expand');
		$('#draw_expand_button').attr('title', 'Contract model');
		$('#header').css("display", "none");
		init();
		animate();
		expanded = true;
	}
	else if(expanded === true){
		$('html').css("height", 'auto');
		$('body').css("height", 'auto');
		$('#col2').removeClass('col2_expand');
		$('#col1').removeClass('col1_expand');
		$('#draw_controls').removeClass('draw_controls_expand');
		$('#wrapper').removeClass('wrapper_expand');
		$('#draw_box').removeClass('draw_box_expand');
		$('#draw_expand_button').attr('title', 'Expand model');
		$('#header').css("display", "block");
		init();
		animate();
		expanded = false;
	}
});

$('#draw_reset_button').click(function(){
	init();
});
});