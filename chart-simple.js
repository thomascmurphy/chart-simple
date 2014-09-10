(function($){
    function makeSVG(tag, attrs, text_content) {
        var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in attrs)
            el.setAttribute(k, attrs[k]);
        if(text_content){
            el.textContent = text_content;
        }
        return el;
    }

    function prettyNumber(number){
        exp_number = number.toExponential();
        notation_parts = exp_number.split('e');
        notation = notation_parts[1];
        if(number > 1000000000){
            notation_string = 'b';
            number_part = number/1000000000;
        } else if(number > 1000000){
            notation_string = 'm';
            number_part = number/1000000;
        } else if(number > 1000){
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
            width = options.width.indexOf('%') > -1 ? (element.width() * parseInt(options.width) / 100) : parseInt(options.width),
            height = options.height.indexOf('%') > -1 ? (element.height() * parseInt(options.height) / 100) : parseInt(options.height),
            colors = options.colors,
            center_x = width/2,
            center_y = height/2,
            outer_radius = Math.min(center_x, center_y),
            donut_thickness = options.donut_thickness.indexOf('%') > -1 ? (2* outer_radius * parseInt(options.donut_thickness) / 100) : parseInt(options.donut_thickness),
            inner_radius = outer_radius - donut_thickness,
            background_color = options.background_color || '#fff',
            full_donut = options.full_donut,
            title = options.title,
            cos = Math.cos,
            sin = Math.sin,
            PI = Math.PI,
            total_radians = full_donut ? 2*PI : 1.5 * PI;

        var svg = $('<svg width="'+ width +'" height="'+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);


        var pieces = [];
        var data_total = 0;
        var start_x = full_donut ? center_x : center_x - outer_radius * (cos(PI/4));
        var start_y = full_donut ? center_y + outer_radius : center_y + outer_radius * (sin(PI/4));
        var start_angle = full_donut ? (3 * PI / 2) : (5 * PI / 4);
        for(var i=0; i<data.length; i++){
            data_total += data[i].value;
        }

        for(var i=0; i<data.length; i++){
            var data_item = data[i],
            arc_length = (data_item.value / data_total) * total_radians,
            end_x_outer = center_x + outer_radius * (cos(start_angle - arc_length)),
            end_y_outer = center_y - outer_radius * (sin(start_angle - arc_length)),
            end_x_inner = center_x + inner_radius * (cos(start_angle - arc_length)),
            end_y_inner = center_y - inner_radius * (sin(start_angle - arc_length)),
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

            var final_sweep = i==0 && !full_donut ? '0 0 1' : '0 0 0';


            var piece_attrs = [
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
                center_x + inner_radius * (cos(start_angle)),
                center_y - inner_radius * (sin(start_angle)),
                'A',
                donut_thickness/2,
                donut_thickness/2,
                final_sweep,
                start_x,
                start_y,
                'Z'
            ];

            var piece_path = makeSVG('path', {d: piece_attrs.join(' '), fill: color, "data-title": data_item.name, "data-value": data_item.value, class: "graph_piece"});
            //var piece_group = makeSVG('g', {'data-position': position});
            //var piece_group = makeSVG('g', {});
            //piece_group.append(piece_path);
            svg.append(piece_path);
            start_x = end_x_outer;
            start_y = end_y_outer;
            start_angle -= arc_length;
        }


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

        if(!full_donut){
            var center_large = makeSVG('text', {x: center_x, y: center_y + inner_radius*3/4, 'text-anchor': 'middle', class:'center_large'}, prettyNumber(data_total));
            var center_small = makeSVG('text', {x: center_x, y: center_y * 2 - donut_thickness, 'text-anchor': 'middle', class:'center_small'}, title);
        } else {
            var center_large = makeSVG('text', {x: center_x, y: center_y, 'text-anchor': 'middle', class:'center_large'}, prettyNumber(data_total));
            var center_small = makeSVG('text', {x: center_x, y: center_y + inner_radius/4, 'text-anchor': 'middle', class:'center_small'}, title);
        }


        svg.append(center_large);
        svg.append(center_small);

        var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo(element);

        element.on('mouseover', 'path.graph_piece', function(e){
            tip.find('span.title').text($(this).data('title'));
            tip.find('span.value').text($(this).data('value'));
            tip.show();
        });

        element.on('mouseleave', 'path.graph_piece', function(e){
           tip.hide();
        });

        element.on('mousemove', 'path.graph_piece', function(e){
            tip.css({'left': e.offsetX - tip.outerWidth()/2 + 'px', 'top': e.offsetY - tip.outerHeight(true) + 'px'});
        });

        element.addClass('chart').addClass('donut_chart');

        return element;

    };


    $.fn.drawPie = function(data, options){
        var element = $(this),
            width = options.width.indexOf('%') > -1 ? (element.width() * parseInt(options.width) / 100) : parseInt(options.width),
            height = options.height.indexOf('%') > -1 ? (element.height() * parseInt(options.height) / 100) : parseInt(options.height),
            colors = options.colors,
            center_x = width/2,
            center_y = height/2,
            outer_radius = Math.min(center_x, center_y),
            title = options.title,
            cos = Math.cos,
            sin = Math.sin,
            PI = Math.PI,
            total_radians = 2*PI;

        var svg = $('<svg width="'+ width +'" height="'+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);

        var pieces = [];
        var data_total = 0;
        var start_x = center_x;
        var start_y = center_y + outer_radius;
        var start_angle = PI * 3/2;
        for(var i=0; i<data.length; i++){
            data_total += data[i].value;
        }

        for(var i=0; i<data.length; i++){
            var data_item = data[i],
            arc_length = (data_item.value / data_total) * total_radians,
            end_x_outer = center_x + outer_radius * (cos(start_angle - arc_length)),
            end_y_outer = center_y - outer_radius * (sin(start_angle - arc_length)),
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
                center_x,
                center_y,
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
                center_x,
                center_y,
                'Z'
            ];

            var piece_path = makeSVG('path', {d: piece_attrs.join(' '), fill: color, "data-title": data_item.name, "data-value": data_item.value, class: "graph_piece"});
            svg.append(piece_path);
            start_x = end_x_outer;
            start_y = end_y_outer;
            start_angle -= arc_length;
        }

        var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo(element);

        element.on('mouseover', 'path.graph_piece', function(e){
            tip.find('span.title').text($(this).data('title'));
            tip.find('span.value').text($(this).data('value'));
            tip.show();
        });

        element.on('mouseleave', 'path.graph_piece', function(e){
           tip.hide();
        });

        element.on('mousemove', 'path.graph_piece', function(e){
            tip.css({'left': e.offsetX - tip.outerWidth()/2 + 'px', 'top': e.offsetY - tip.outerHeight(true) + 'px'});
        });

        element.addClass('chart').addClass('pie_chart');

        return element;
    };

    $.fn.drawBar = function(data, options){
        var element = $(this),
            width = options.width.indexOf('%') > -1 ? (element.width() * parseInt(options.width) / 100) : parseInt(options.width),
            height = options.height.indexOf('%') > -1 ? (element.height() * parseInt(options.height) / 100) : parseInt(options.height),
            bar_spacing = parseInt(options.bar_spacing),
            colors = options.colors,
            background_color = options.background_color || '#fff',
            title = options.title,
            cos = Math.cos,
            sin = Math.sin,
            PI = Math.PI;

        var svg = $('<svg width="'+ width +'" height="'+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);

        var pieces = [];
        var data_total = 0;
        var data_max = 0;
        var start_x = bar_spacing;
        var start_y = height;
        var bar_width = (width - ((data.length + 1) * bar_spacing)) / data.length;
        for(var i=0; i<data.length; i++){
            data_total += data[i].value;
            if(data[i].value > data_max){
                data_max = data[i].value;
            }
        }

        for(var i=0; i<data.length; i++){
            var data_item = data[i],
            bar_height = height * data_item.value / data_max,
            color = colors[i%colors.length];



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

            var piece_path = makeSVG('path', {d: piece_attrs.join(' '), fill: color, "data-title": data_item.name, "data-value": data_item.value, class: "graph_piece"});
            svg.append(piece_path);
            start_x += (bar_width + bar_spacing);
        }

        var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo(element);

        element.on('mouseover', 'path.graph_piece', function(e){
            tip.find('span.title').text($(this).data('title'));
            tip.find('span.value').text($(this).data('value'));
            tip.show();
        });

        element.on('mouseleave', 'path.graph_piece', function(e){
           tip.hide();
        });

        element.on('mousemove', 'path.graph_piece', function(e){
            tip.css({'left': e.offsetX - tip.outerWidth()/2 + 'px', 'top': e.offsetY - tip.outerHeight(true) + 'px'});
        });

        element.addClass('chart').addClass('pie_chart');

        return element;
    };

    drawMeter = function(element, data, options){

    };
})(jQuery);