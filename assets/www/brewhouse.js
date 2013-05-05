var URL_BASE = "http://192.168.1.64";

var nothing_data = {};
var sp_data = {
    temp : 130,
    run : 1
};
var pid_data = {
    temp : 110,
    run : 1,
    kp : 1250,
    ki : 20,
    kd : 625
}

var states = {
	0 : 'Nothing.',
	1 : 'Running setpoint.',
	2 : 'Running PID.'
}

var mc = {
	timeout : null,
	get_new_data_now : function() {
		clearTimeout(mc.timeout);
		mc.update_info();
	},
	update_info : function() {
		$.get(URL_BASE + '/status.json', function(data) {
			if (data.temp != null) $('#rims_temp').val(data.temp);
			if (data.setpoint != null) $('#setpoint').val(data.setpoint);
			if (data.element == 1) {
				$('#element').val('ON');
				$('#element_icon').removeClass('icon-ban-circle');
				$('#element_icon').addClass('icon-ok-circle');
			} else {
				$('#element').val('OFF');
				$('#element_icon').removeClass('icon-ok-circle');
				$('#element_icon').addClass('icon-ban-circle');
			}
			if (data.bkelement == 1) {
				$('#bk').val('ON');
				$('#bk_icon').addClass('icon-ok-circle');
			} else {
				$('#bk').val('OFF');
				$('#bk_icon').addClass('icon-ban-circle');
			}
			if (data.bkavailable == 1) {
				$('#bk_active').empty().append("(Active)");
			} else {
				$('#bk_active').empty().append("(Inactive)");
			}
			if (data.pump == 1) {
				$('#pump').val('ON');
				$('#pump_icon').removeClass('icon-ban-circle');
				$('#pump_icon').addClass('icon-ok-circle');
			} else {
				$('#pump').val('OFF');
				$('#pump_icon').removeClass('icon-ok-circle');
				$('#pump_icon').addClass('icon-ban-circle');
			}
			if (data.state != null) {
				$('#state').val(states[data.state]);
			}
			mc.timeout = setTimeout(mc.update_info, 10000);
		});					
	},
	slow_update : function() {
		$.get(URL_BASE + '/getboxtemp.go', function(data) {
			if (data.box_temp != null) $('#box_temp').val(data.box_temp);
			setTimeout(mc.update_info, 120000);
		});
	},
	turn_on_pump : function() {
		$.post(URL_BASE + '/runpump.go', 
				{
					pumpstate : 1
			    }, function() {
			    	mc.get_new_data_now();
			    });
	},
	turn_off_system : function() {
		$.post(URL_BASE + '/runnothing.go', 
				{}, function() {
			    	mc.get_new_data_now();
			    });
	},
	mash : function(water_temp) {
		$.post(URL_BASE + '/runpid.go',
				{
					temp : water_temp,
					bkOn : 0,
				    kp : 1250,
				    ki : 20,
				    kd : 625
				}, function() {
			    	mc.get_new_data_now();
			    });
	},
	boil : function() {
		$.post(URL_BASE + '/runsetpoint.go',
				{
					temp : 210,
					rims: 1
				}, function() {
			    	mc.get_new_data_now();
			    });
		$.post(URL_BASE + '/runbk.go', 
				{
				    bkstate : 1
			    }, function() {});
		$.post(URL_BASE + '/runbk.go', 
				{
				    bkstate : 1
			    }, function() {});
	},
	prepare_strike_water : function(water_temp) {
		$.post(URL_BASE + '/runsetpoint.go', 
				{
				    temp : water_temp,
				    rims : 1
			    }, function() {
			    	mc.get_new_data_now();
			    });
		$.post(URL_BASE + '/runbk.go', 
				{
				    bkstate : 1
			    }, function() {});
	},
	prepare_sparge_water : function(water_temp) {
		$.post(URL_BASE + '/runbk.go', 
				{
				    bkstate : 1
			    }, function() {
			    	mc.get_new_data_now();
			    });
	}
}


//document.addEventListener('deviceready', function(){
$(function() {
	mc.update_info();
	mc.slow_update();
	
	$('#execute_strike_water').click(function(event) {
		var strike_temp = $('#strike_temp').val();
		mc.prepare_strike_water(strike_temp);
		event.preventDefault();
	});
	$('#prepare_sparge').click(function(event){
		var sparge_temp = $('#sparge_temp').val();
		mc.prepare_sparge_water(sparge_temp);
		event.preventDefault();
	});
	$('#run_the_pump').click(function(event) {
		event.preventDefault();
		if(confirm('Check that hoses are connected!')) {
			mc.turn_on_pump();
		}
	});
	$('#boil').click(function(event) {
		mc.boil();
		event.preventDefault();
	})
	$('#execute_mash').click(function(event) {
		var mash_temp = $('#mash_temp').val();
		var min_mash_temp = $('#mash_min_temp').val();
		var time = $('#number_of_minutes').val() * 1000 * 60;
		mc.mash(mash_temp);
		var x;
		x = function() {
			if ($('#rims_temp').val() > min_mash_temp) {
				setTimeout(function() {
					alert('time is up!')
				}, time);
			} else {
				setTimeout(x, 2000);
			}
		}
		
		event.preventDefault();		
	});
	$('#turn_off').click(function(event) {
		event.preventDefault();
		mc.turn_off_system();
	});
	$('#show_status').click(function(event){
		$('#run_command').hide();
		$('#status').show();
		$('ul.nav li').removeClass('active');
		$('#show_status').addClass('active');
		event.preventDefault();
	});
	$('#run_a_step').click(function(event){
		$('#status').hide();
		$('#run_command').show();
		$('ul.nav li').removeClass('active');
		$('#run_a_step').addClass('active');
		event.preventDefault();
	});
});