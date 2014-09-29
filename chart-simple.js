(function($){
    var secondary_text_color = '#999';
    var indicator_color = '#6bb8b6';

    function makeSVG(tag, attrs, text_content) {
        var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in attrs)
            el.setAttribute(k, attrs[k]);
        if(text_content){
            el.textContent = text_content;
        }
        return el;
    }

    prettyNumber = function(number){
        exp_number = number.toExponential();
        notation_parts = exp_number.split('e');
        notation = notation_parts[1];
        if(number >= 1000000000){
            notation_string = 'b';
            number_part = number/1000000000;
        } else if(number >= 1000000){
            notation_string = 'm';
            number_part = number/1000000;
        } else if(number >= 1000){
            notation_string = 'k';
            number_part = number/1000;
        } else {
            notation_string = '';
            number_part = number;
        }

        if(number_part < 10){
             number_part = Math.round(number_part * 10)/10
        } else {
             number_part = Math.round(number_part)
        }
        return number_part + notation_string;
    }



    $.fn.drawDonut = function(data, options){
        var element = $(this),
            has_key = options.has_key,
            width = options.has_key ? 200 : 100,
            height = 100,
            colors = options.colors,
            center_x = width/2,
            center_y = height/2,
            outer_radius = Math.min(center_x, center_y),
            donut_thickness = options.donut_thickness.indexOf('%') > -1 ? (2* outer_radius * parseInt(options.donut_thickness) / 100) : parseInt(options.donut_thickness),
            inner_radius = outer_radius - donut_thickness,
            background_color = options.background_color || '#fff',
            full_donut = options.full_donut,
            title = options.title,
            no_text = options.no_text || false,
            goal_value = options.goal_value,
            rounded = options.rounded || false,
            start_angle,
            cos = Math.cos,
            sin = Math.sin,
            PI = Math.PI,
            total_radians = full_donut ? 2*PI : 1.5 * PI;

        var svg = $('<svg width="100%" height="100%" viewBox="0, 0, ' + width +', '+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);


        var pieces = [];
        var key_data = [];
        var data_total = 0;
        var start_x;
        var start_y;
        if(typeof options.start_angle != 'undefined'){
            start_angle = options.start_angle;
            start_x = outer_radius + outer_radius * (cos(start_angle));
            start_y = outer_radius - outer_radius * (sin(start_angle));
        } else {
            start_angle = full_donut ? (3 * PI / 2) : (5 * PI / 4);
            start_x = full_donut ? outer_radius : outer_radius - outer_radius * (cos(PI/4));
            start_y = full_donut ? 2 * outer_radius : outer_radius + outer_radius * (sin(PI/4));
        }

        for(var i=0; i<data.length; i++){
            data_total += data[i].value;
        }

        var data_total_display = data_total;
        if(goal_value && goal_value > data_total){
            data.push({name: 'Remaining', value: goal_value - data_total});
            if(data_total > 0 ){
                data_total = goal_value;
            } else {
                data_total = goal_value + goal_value * 0.005;
            }
        } else if(data.length==1 && full_donut){
            if(rounded){
                data_total += data_total * 0.01;
            } else {
                data_total += data_total * 0.005;
            }
        }



        if(data_total > 0){
            for(var i=0; i<data.length; i++){
                var data_item = data[i],
                arc_length = (data_item.value / data_total) * total_radians,
                end_x_outer = outer_radius + outer_radius * (cos(start_angle - arc_length)),
                end_y_outer = outer_radius - outer_radius * (sin(start_angle - arc_length)),
                end_x_inner = outer_radius + inner_radius * (cos(start_angle - arc_length)),
                end_y_inner = outer_radius - inner_radius * (sin(start_angle - arc_length)),
                color = colors[i%colors.length],
                arc_outer_sweep,
                arc_inner_sweep;

                if(arc_length >= PI){
                    arc_outer_sweep = '0 1 1';
                    arc_inner_sweep = '0 1 0';
                } else {
                    arc_outer_sweep = '0 0 1';
                    arc_inner_sweep = '0 0 0';
                }

                var final_sweep = i==0 && !full_donut ? '0 0 1' : '0 0 0';

                var piece_attrs;

                if(rounded){

                    piece_attrs = [
                        'M',
                        start_x,
                        start_y,
                        'A',
                        outer_radius,
                        outer_radius,
                        arc_outer_sweep,
                        end_x_outer,
                        end_y_outer,
                        'A',
                        donut_thickness/2,
                        donut_thickness/2,
                        '0 1 1',
                        end_x_inner,
                        end_y_inner,
                        'A',
                        inner_radius,
                        inner_radius,
                        arc_inner_sweep,
                        outer_radius + inner_radius * (cos(start_angle)),
                        outer_radius - inner_radius * (sin(start_angle)),
                        'A',
                        donut_thickness/2,
                        donut_thickness/2,
                        final_sweep,
                        start_x,
                        start_y,
                        'Z'
                    ];
                } else {
                    piece_attrs = [
                        'M',
                        start_x,
                        start_y,
                        'A',
                        outer_radius,
                        outer_radius,
                        arc_outer_sweep,
                        end_x_outer,
                        end_y_outer,
                        'L',
                        end_x_inner,
                        end_y_inner,
                        'A',
                        inner_radius,
                        inner_radius,
                        arc_inner_sweep,
                        outer_radius + inner_radius * (cos(start_angle)),
                        outer_radius - inner_radius * (sin(start_angle)),
                        'L',
                        start_x,
                        start_y,
                        'Z'
                    ];
                }

                var piece_path = makeSVG('path', {d: piece_attrs.join(' '), fill: color, "data-title": data_item.name, "data-value": data_item.value, class: "graph_piece"});
                svg.append(piece_path);
                start_x = end_x_outer;
                start_y = end_y_outer;
                start_angle = (start_angle - arc_length) > 0 ?  (start_angle - arc_length) % (2*PI) : start_angle - arc_length + 2*PI;

                key_data.push({'color': color, 'title': data_item.name, 'percentage': Math.round(100*(data_item.value / data_total))});
            }
        }


        /*
if(!full_donut){
            var base_path = [
                'M',
                center_x + outer_radius * (cos(PI/4)),
                center_y + outer_radius * (sin(PI/4)),
                'A',
                outer_radius,
                outer_radius,
                '0 0 1',
                center_x - outer_radius * (cos(PI/4)),
                center_y + outer_radius * (sin(PI/4)),
                'A',
                donut_thickness/2,
                donut_thickness/2,
                '0 1 0',
                center_x - inner_radius * (cos(PI/4)),
                center_y + inner_radius * (sin(PI/4)),
                'A',
                inner_radius,
                inner_radius,
                '0 1 1',
                center_x + inner_radius * (cos(PI/4)),
                center_y + inner_radius * (sin(PI/4)),
                'A',
                donut_thickness/2,
                donut_thickness/2,
                '0 1 0',
                center_x + outer_radius * (cos(PI/4)),
                center_y + outer_radius * (sin(PI/4)),
                'Z'
            ];

            var donut_hole = makeSVG('path', {d: base_path.join(' '), fill: background_color});

        }else{

            var donut_hole = makeSVG('circle', {cx: center_x, cy: center_y, r:inner_radius, fill: background_color});

        }

        svg.append(donut_hole);
*/

        if(!no_text){
            if(!full_donut){
                var center_large = makeSVG('text', {x: outer_radius, y: outer_radius + inner_radius*3/4 + donut_thickness/2, 'text-anchor': 'middle', class:'center_large'}, prettyNumber(data_total_display));
                var center_small = makeSVG('text', {x: outer_radius, y: outer_radius * 2 - donut_thickness/2, fill: secondary_text_color, 'text-anchor': 'middle', class:'center_small'}, title);
            } else {
                var center_large = makeSVG('text', {x: outer_radius, y: outer_radius, 'text-anchor': 'middle', class:'center_large'}, prettyNumber(data_total_display));
                var center_small = makeSVG('text', {x: outer_radius, y: outer_radius + inner_radius/4, fill: secondary_text_color, 'text-anchor': 'middle', class:'center_small'}, title);
            }
        }


        svg.append(center_large);
        svg.append(center_small);

        if(has_key){
            var key_line_height = height / key_data.length;
            var key_circle_radius = Math.min(5, key_line_height);
            for(var i=0; i<key_data.length; i++){
                var key_data_item = key_data[i];
                var key_circle = makeSVG('circle', {cx: center_x + 2*key_circle_radius, cy: (i*key_line_height) + key_circle_radius, r: key_circle_radius, fill: key_data_item['color'], class: 'key_circle'});
                var key_text = makeSVG('text', {x: center_x + 4*key_circle_radius, y: i*key_line_height + 1.5*key_circle_radius, fill: secondary_text_color, class: 'key_text'}, key_data_item.title+' ('+key_data_item.percentage+'%)');
                svg.append(key_circle);
                svg.append(key_text);
            }
        }

        var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

        element.on('mouseover', 'path.graph_piece', function(e){
            tip.find('span.title').text($(this).data('title'));
            tip.find('span.value').text(prettyNumber($(this).data('value')));
            tip.show();
        });

        element.on('mouseleave', 'path.graph_piece', function(e){
           tip.hide();
        });

        element.on('mousemove', 'path.graph_piece', function(e){
            tip.css({'left': e.pageX - tip.outerWidth()/2 + 'px', 'top': e.pageY - tip.outerHeight(true) + 'px'});
        });

        element.addClass('chart').addClass('donut_chart');
        if(has_key){
            element.addClass('has_key');
        }

        return element;

    };







    $.fn.drawPie = function(data, options){
        var element = $(this),
            //width = options.width.indexOf('%') > -1 ? (element.width() * parseInt(options.width) / 100) : parseInt(options.width),
            //height = options.height.indexOf('%') > -1 ? (element.height() * parseInt(options.height) / 100) : parseInt(options.height),
            width = options.has_key ? 200 : 100,
            height = 100,
            colors = options.colors,
            center_x = width/2,
            center_y = height/2,
            outer_radius = Math.min(center_x, center_y),
            title = options.title,
            has_key = options.has_key,
            cos = Math.cos,
            sin = Math.sin,
            PI = Math.PI,
            total_radians = 2*PI;

        var svg = $('<svg width="100%" height="100%" viewBox="0, 0, ' + width +', '+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);

        var pieces = [];
        var key_data = [];
        var data_total = 0;
        var start_x = outer_radius;
        var start_y = outer_radius + outer_radius;
        var start_angle = PI * 3/2;
        for(var i=0; i<data.length; i++){
            data_total += data[i].value;
        }

        if(data_total > 0){
            for(var i=0; i<data.length; i++){
                var data_item = data[i],
                arc_length = (data_item.value / data_total) * total_radians,
                end_x_outer = outer_radius + outer_radius * (cos(start_angle - arc_length)),
                end_y_outer = outer_radius - outer_radius * (sin(start_angle - arc_length)),
                color = colors[i%colors.length],
                arc_outer_sweep,
                arc_inner_sweep;

                if(start_angle > (PI/2) && start_angle <= (3*PI/2)){
                    if(arc_length >= PI){
                        arc_outer_sweep = '0 1 1';
                        arc_inner_sweep = '0 1 0';
                    } else {
                        arc_outer_sweep = '0 0 1';
                        arc_inner_sweep = '0 0 0';
                    }
                } else {
                    if(arc_length >= PI){
                        arc_outer_sweep = '0 0 1';
                        arc_inner_sweep = '0 0 0';
                    } else {
                        arc_outer_sweep = '0 0 1';
                        arc_inner_sweep = '0 0 0';
                    }
                }


                var piece_attrs = [
                    'M',
                    outer_radius,
                    outer_radius,
                    'L',
                    start_x,
                    start_y,
                    'A',
                    outer_radius,
                    outer_radius,
                    arc_outer_sweep,
                    end_x_outer,
                    end_y_outer,
                    'L',
                    outer_radius,
                    outer_radius,
                    'Z'
                ];

                var piece_path = makeSVG('path', {d: piece_attrs.join(' '), fill: color, "data-title": data_item.name, "data-value": data_item.value, class: "graph_piece"});
                svg.append(piece_path);
                start_x = end_x_outer;
                start_y = end_y_outer;
                start_angle -= arc_length;

                key_data.push({'color': color, 'title': data_item.name, 'percentage': Math.round(100*(data_item.value / data_total))});
            }
        }

        if(has_key){
            var key_line_height = height / key_data.length;
            var key_circle_radius = Math.min(5, key_line_height);
            for(var i=0; i<key_data.length; i++){
                var key_data_item = key_data[i];
                var key_circle = makeSVG('circle', {cx: center_x + 2*key_circle_radius, cy: (i*key_line_height) + key_circle_radius, r: key_circle_radius, fill: key_data_item['color'], class: 'key_circle'});
                var key_text = makeSVG('text', {x: center_x + 4*key_circle_radius, y: i*key_line_height + 1.5*key_circle_radius, fill: secondary_text_color, class: 'key_text'}, key_data_item.title+' ('+key_data_item.percentage+'%)');
                svg.append(key_circle);
                svg.append(key_text);
            }
        }

        var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

        element.on('mouseover', 'path.graph_piece', function(e){
            tip.find('span.title').text($(this).data('title'));
            tip.find('span.value').text(prettyNumber($(this).data('value')));
            tip.show();
        });

        element.on('mouseleave', 'path.graph_piece', function(e){
           tip.hide();
        });

        element.on('mousemove', 'path.graph_piece', function(e){
            tip.css({'left': e.pageX - tip.outerWidth()/2 + 'px', 'top': e.pageY - tip.outerHeight(true) + 'px'});
        });

        element.addClass('chart').addClass('pie_chart');
        if(has_key){
            element.addClass('has_key');
        }

        return element;
    };








    $.fn.drawBar = function(data, options){
        var element = $(this),
            //width = options.width.indexOf('%') > -1 ? (element.width() * parseInt(options.width) / 100) : parseInt(options.width),
            //height = options.height.indexOf('%') > -1 ? (element.height() * parseInt(options.height) / 100) : parseInt(options.height),
            aspect_ratio = options.aspect_ratio ? options.aspect_ratio : 2,
            width = 100 * aspect_ratio,
            height = 100,
            bar_spacing = parseInt(options.bar_spacing),
            colors = options.colors,
            background_color = options.background_color || '#fff',
            title = options.title,
            hover = options.hover,
            rounded_tops = options.rounded_tops,
            average_line = options.average_line,
            goal_value = typeof options.goal_value === 'undefined' ? null : options.goal_value,
            color_switch,
            cos = Math.cos,
            sin = Math.sin,
            PI = Math.PI;

        var svg = $('<svg width="100%" height="100%" viewBox="0, 0, ' + width +', '+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);

        var indicator_width = average_line || goal_value ? 16 : 0;
        var indicator_height = average_line || goal_value ? 8 : 0;
        var area_width = width - indicator_width;
        var area_height = hover && !title ? height : height - 10;
        var max_bar_height = area_height - 10;
        var pieces = [];
        var data_total = 0;
        var data_max = 1;
        var start_x = width - area_width + bar_spacing/2;
        var start_y = area_height;
        var bar_width = (area_width - ((data.length) * bar_spacing)) / data.length;
        for(var i=0; i<data.length; i++){
            data_total += data[i].value;
            if(data[i].value > data_max){
                data_max = data[i].value;
            }
        }

        if(average_line || goal_value){
            var indicated_height;
            if(average_line){
                color_switch = data_total / data.length;
                indicated_height = max_bar_height * color_switch / data_max;

            } else {
                color_switch = goal_value;
                indicated_height = max_bar_height * goal_value / data_max;
            }

            var value_indicator = makeSVG('rect', {x: width - area_width, y: start_y - indicated_height, width: area_width, height: indicated_height, fill: 'rgba(0, 0, 0, 0.1)'});
            svg.append(value_indicator);

            var indicator_path = [
                'M',
                width - area_width,
                start_y - indicated_height,
                'L',
                width - area_width - indicator_height/2,
                start_y - indicated_height + indicator_height/2,
                'L',
                0,
                start_y - indicated_height + indicator_height/2,
                'L',
                0,
                start_y - indicated_height - indicator_height/2,
                'L',
                indicator_width - indicator_height/2,
                start_y - indicated_height - indicator_height/2,
                'Z'
            ]
            var color_switch_indicator = makeSVG('path', {d: indicator_path.join(' '), fill: indicator_color, class: 'goal_indicator'});
            svg.append(color_switch_indicator);
            var color_switch_text = makeSVG('text', {x: (indicator_width - indicator_height/2)/2, y: start_y - indicated_height + indicator_height/2 - 2, 'text-anchor': 'middle', fill: '#fff', class: 'goal_indicator_text'}, prettyNumber(color_switch));
            svg.append(color_switch_text);
        }


        if(color_switch){

            for(var i=0; i<data.length; i++){
                var data_item = data[i],
                lower_bar_height = max_bar_height * Math.min(data_item.value, color_switch) / data_max,
                bar_height = max_bar_height * data_item.value / data_max,
                lower_color = colors[0],
                upper_color = colors[colors.length - 1],
                bar_class = hover ? "graph_piece" : "";

                if(bar_height > lower_bar_height){
                    var upper_start_y = start_y - lower_bar_height,
                    upper_bar_height = bar_height - lower_bar_height;
                    var upper_piece_attrs = [
                        'M',
                        start_x,
                        upper_start_y,
                        'L',
                        start_x,
                        upper_start_y - upper_bar_height + Math.min(bar_width/2, upper_bar_height),
                        'A',
                        bar_width/2,
                        Math.min(bar_width/2, upper_bar_height),
                        '0 0 1',
                        start_x + bar_width,
                        upper_start_y - upper_bar_height + Math.min(bar_width/2, upper_bar_height),
                        'L',
                        start_x + bar_width,
                        upper_start_y,
                        'Z'
                    ];
                    var upper_piece_path = makeSVG('path', {d: upper_piece_attrs.join(' '), fill: upper_color, "data-title": data_item.name, "data-value": data_item.value, class: bar_class});
                    svg.append(upper_piece_path);
                }

                var lower_piece_attrs = [
                    'M',
                    start_x,
                    start_y,
                    'L',
                    start_x,
                    start_y - lower_bar_height,
                    'L',
                    start_x + bar_width,
                    start_y - lower_bar_height,
                    'L',
                    start_x + bar_width,
                    start_y,
                    'Z'
                ];
                var lower_piece_path = makeSVG('path', {d: lower_piece_attrs.join(' '), fill: lower_color, "data-title": data_item.name, "data-value": data_item.value, class: bar_class});
                svg.append(lower_piece_path);





                if(!hover){
                    var value_text = makeSVG('text', {x: start_x + bar_width/2, y: start_y - bar_height - 1, fill: secondary_text_color, 'text-anchor': 'middle', class: "key_text"}, prettyNumber(data_item.value));

                    var title_text = makeSVG('text', {x: start_x + bar_width/2, y: height - 1, fill: secondary_text_color, 'text-anchor': 'middle', class: "key_text"}, data_item.name);

                    svg.append(value_text);
                    svg.append(title_text);
                }

                start_x += (bar_width + bar_spacing);

            }

        } else {

            for(var i=0; i<data.length; i++){
                var data_item = data[i],
                bar_height = max_bar_height * data_item.value / data_max,
                color = colors[i%colors.length],
                bar_class = hover ? "graph_piece" : "";

                if(rounded_tops){
                    var piece_attrs = [
                        'M',
                        start_x,
                        start_y,
                        'L',
                        start_x,
                        start_y - bar_height + bar_width/2,
                        'A',
                        bar_width/2,
                        bar_width/2,
                        '0 0 1',
                        start_x + bar_width,
                        start_y - bar_height + bar_width/2,
                        'L',
                        start_x + bar_width,
                        start_y,
                        'Z'
                    ];
                } else {
                    var piece_attrs = [
                        'M',
                        start_x,
                        start_y,
                        'L',
                        start_x,
                        start_y - bar_height,
                        'L',
                        start_x + bar_width,
                        start_y - bar_height,
                        'L',
                        start_x + bar_width,
                        start_y,
                        'Z'
                    ];
                }

                var piece_path = makeSVG('path', {d: piece_attrs.join(' '), fill: color, "data-title": data_item.name, "data-value": data_item.value, class: bar_class});
                svg.append(piece_path);


                if(!hover){
                    var value_text = makeSVG('text', {x: start_x + bar_width/2, y: start_y - bar_height - 1, fill: secondary_text_color, 'text-anchor': 'middle', class: "key_text"}, prettyNumber(data_item.value));

                    var title_text = makeSVG('text', {x: start_x + bar_width/2, y: height - 1, fill: secondary_text_color, 'text-anchor': 'middle', class: "key_text"}, data_item.name);

                    svg.append(value_text);
                    svg.append(title_text);
                }

                start_x += (bar_width + bar_spacing);
            }

        } /* end non-colorchange */

        if(hover && title){
            var graph_title = makeSVG('text', {x: width/2, y: height - 2, fill: secondary_text_color, 'text-anchor': 'middle', class:'key_text'}, title);
        }




        svg.append(graph_title);

        if(hover){

            var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

            element.on('mouseover', 'path.graph_piece', function(e){
                tip.find('span.title').text($(this).data('title'));
                tip.find('span.value').text(prettyNumber($(this).data('value')));
                tip.show();
            });

            element.on('mouseleave', 'path.graph_piece', function(e){
               tip.hide();
            });

            element.on('mousemove', 'path.graph_piece', function(e){
                tip.css({'left': e.pageX - tip.outerWidth()/2 + 'px', 'top': e.pageY - tip.outerHeight(true) + 'px'});
            });

        }

        element.addClass('chart').addClass('bar_chart');

        return element;
    };




    $.fn.drawComparison = function(data, options){
        var element = $(this),
            aspect_ratio = options.aspect_ratio ? options.aspect_ratio : 1,
            width = 100 * aspect_ratio,
            height = 100,
            colors = options.colors,
            shapes = options.shapes,
            background_color = options.background_color || '#fff',
            title = options.title,
            hover = options.hover,
            piece_class = hover ? "graph_piece" : "",
            cos = Math.cos,
            sin = Math.sin,
            PI = Math.PI;

        var svg = $('<svg width="100%" height="100%" viewBox="0, 0, ' + width +', '+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);

        var data_total=0;
        for(var i=0; i<data.length; i++){
            data_total += data[i].value;
        }


        var start_x = 0,
            area_height = hover && !title ? height : height - 10,
            start_y = area_height;


        if(data_total > 0){
            for(var i=0; i<data.length; i++){
                var data_item = data[i],
                color = colors[i%colors.length],
                shape = shapes[i%shapes.length],
                percentage = Math.round(data_item.value/data_total * 100) / 100,
                piece_width = Math.round(percentage * width * 100) / 100,
                piece_height = Math.round(percentage * height * 100) / 100;

                var piece_path = makeSVG('path', {d: shape, fill: color, "data-title": data_item.name, "data-value": Math.round(percentage * 100) + '%', class: piece_class, transform: 'translate('+ start_x +', '+ (start_y - piece_height) +'), scale('+ percentage + ')'});
                svg.append(piece_path);


                if(!hover){
                    var value_text = makeSVG('text', {x: start_x + piece_width/2, y: start_y - piece_height - 1, fill: secondary_text_color, 'text-anchor': 'middle', class: "key_text large"}, Math.round(percentage * 100) + '%');

                    var title_text = makeSVG('text', {x: start_x + piece_width/2, y: height - 1, fill: secondary_text_color, 'text-anchor': 'middle', class: "key_text"}, data_item.name);

                    svg.append(value_text);
                    svg.append(title_text);
                }

                start_x += piece_width;
            }
        }


        if(hover && title){
            var graph_title = makeSVG('text', {x: width/2, y: height - 2, fill: secondary_text_color, 'text-anchor': 'middle', class:'key_text'}, title);
        }

        svg.append(graph_title);

        if(hover){

            var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

            element.on('mouseover', 'path.graph_piece', function(e){
                tip.find('span.title').text($(this).data('title'));
                tip.find('span.value').text($(this).data('value'));
                tip.show();
            });

            element.on('mouseleave', 'path.graph_piece', function(e){
               tip.hide();
            });

            element.on('mousemove', 'path.graph_piece', function(e){
                tip.css({'left': e.pageX - tip.outerWidth()/2 + 'px', 'top': e.pageY - tip.outerHeight(true) + 'px'});
            });

        }

        element.addClass('chart').addClass('comparison_chart');

        return element;
    };

})(jQuery);