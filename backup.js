//jQuery Slider for draw_box
var multiplier;
$('#draw_slider').slider( {
	value:4000,
	min: 1,
	max: 10000,
	step: 10,
	slide: function() {
		multiplier = $('#draw_slider').slider("value");
		draw();
	}
});

//jQuery progressbar for result
$('#result_progressbar').progressbar({
	value:0
});

var stage = new Kinetic.Stage({
		container: "draw_box",
		width:$('#draw_box').width(),
		height:$('#draw_box').height()
});	

var layer = new Kinetic.Layer();


draw();
function draw(){		
	layer.remove(rect_tube);
	layer.remove(water);
	layer.remove(rect_mix);
	layer.remove(rect_pipe);
	layer.remove(rect_nozzle);
	stage.remove(layer);
	var tube_length = Math.ceil(($('#TUBE_LENGTH').val())*multiplier);
	var tube_diameter = Math.ceil(($('#TUBE_DIAMETER').val())*multiplier);
	var mix_diameter = Math.ceil(($('#MIXING_CHAMBER_DIAMETER').val())*multiplier);
	var mix_length = Math.ceil(($('#MIXING_CHAMBER_LENGTH').val())*multiplier);
	var pipe_length = Math.ceil(($('#PIPE_LENGTH').val())*multiplier);
	var pipe_diameter = Math.ceil(($('#PIPE_DIAMETER').val())*multiplier);
	var nozzle_diameter = Math.ceil(($('#NOZZLE_DIAMETER').val())*multiplier);
	var nozzle_height = 0.01*multiplier;
	
	var x_offset_tube = Math.floor((stage.getWidth()/2) - (tube_diameter/2));
	var rect_tube = new Kinetic.Rect({
		x:x_offset_tube,
		y:stage.getHeight()-tube_length - 50,
		width:tube_diameter,
		height:tube_length,
		fill:"#000"
	});
		
	var x_offset_water = Math.floor((stage.getWidth()/2) - (tube_diameter/2));
	var water = new Kinetic.Rect({
		x:x_offset_water,
		y:rect_tube.getY() + tube_length +5,
		width:tube_diameter,
		height:40,
		fill:"#00f"
	});
	
	var x_offset_mix = Math.floor((stage.getWidth()/2) - (mix_diameter/2));
	var rect_mix = new Kinetic.Rect({
		x:x_offset_mix,
		y:rect_tube.getY()-mix_length,
		width:mix_diameter,
		height:mix_length,
		fill:"#0f0"
	});
	
	var x_offset_pipe = Math.floor((stage.getWidth()/2) + mix_diameter/2);
	var rect_pipe = new Kinetic.Rect({
		x:x_offset_pipe,
		y:rect_mix.getY() + (mix_length/2) - (pipe_diameter/2),
		width:pipe_length,
		height:pipe_diameter,
		fill:"#f00"
	});
	
	var x_offset_nozzle = Math.floor((stage.getWidth()/2) - (nozzle_diameter/2));
	var rect_nozzle = new Kinetic.Rect({
		x:x_offset_nozzle,
		y:rect_mix.getY() - nozzle_height,
		width:nozzle_diameter,
		height:nozzle_height,
		fill:"#000"
	});
	layer.add(rect_mix);
	layer.add(rect_pipe)
	layer.add(rect_tube);
	layer.add(rect_nozzle);
	layer.add(water);
	stage.add(layer);
}