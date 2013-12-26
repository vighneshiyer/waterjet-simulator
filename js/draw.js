$(document).ready(function() {
	var stage = new Kinetic.Stage({
		container: "draw_box",
		width:300,
		height:600,
		fill:"#000"
	});
	var multiplier = 1300;
	$('.geofield').blur(function(){
		draw();
	})
	
	draw();
	function draw(){
		stage.clear();
		var layer = new Kinetic.Layer();
		var tube_length = Math.floor(($('#TUBE_LENGTH').val())*multiplier);
		var tube_diameter = Math.floor(($('#TUBE_DIAMETER').val())*multiplier);
		var mix_diameter = Math.floor(($('#MIXING_CHAMBER_DIAMETER').val())*multiplier);
		var mix_length = Math.floor(($('#MIXING_CHAMBER_LENGTH').val())*multiplier);
		var pipe_length = Math.floor(($('#PIPE_LENGTH').val())*multiplier);
		var pipe_diameter = Math.floor(($('#PIPE_DIAMETER').val())*multiplier);
		var nozzle_diameter = Math.floor(($('#NOZZLE_DIAMETER').val())*multiplier);
		var nozzle_height = 30;
		
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
		
		var x_offset_pipe = (stage.getWidth()/2) + mix_diameter/2;
		var rect_pipe = new Kinetic.Rect({
			x:x_offset_pipe,
			y:rect_mix.getY() + (mix_length/2) - (pipe_diameter/2),
			width:pipe_length,
			height:pipe_diameter,
			fill:"#f00"
		});
		
		var x_offset_nozzle = (stage.getWidth()/2) - (nozzle_diameter/2);
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
	
});
