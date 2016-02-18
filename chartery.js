(function($){
  var secondary_text_color = '#999';
  var indicator_color = '#6bb8b6';

  function convertEntities(html) {
    var el = document.createElement("div");
    el.innerHTML = html;
    return el.firstChild.data;
  }

  function makeSVG(tag, attrs, text_content) {
    var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs)
      el.setAttribute(k, attrs[k]);
    if(text_content){
      el.textContent = convertEntities(text_content);
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
        number_decorator = options.number_decorator || "",
        no_text = options.no_text || false,
        goal_value = options.goal_value,
        goal_value_text = options.goal_value_text || "Remaining",
        rounded = options.rounded || false,
        no_tip = options.no_tip || false,
        start_angle,
        cos = Math.cos,
        sin = Math.sin,
        PI = Math.PI,
        total_radians = full_donut ? 2*PI : 1.5 * PI;

    var svg = $('<svg width="100%" height="100%" viewBox="0, 0, ' + width +', '+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);


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
    var one_piece = false;

    if(goal_value && goal_value > data_total){
      data.push({name: goal_value_text, value: goal_value - data_total});
      if(data_total == 0 ){
        one_piece = true;
      }
      data_total = goal_value;
    } else if(data.length==1 && full_donut){
      one_piece = true;
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
        var path_type = 'path';

        if(one_piece && full_donut && data_item.value > 0){

          var piece_path = makeSVG('circle',
                                   {
                                     "cx": outer_radius,
                                     "cy": outer_radius,
                                     "r": inner_radius + donut_thickness/2,
                                     "stroke": color,
                                     "stroke-width": donut_thickness,
                                     "fill": "none",
                                     "data-title": data_item.name,
                                     "data-value": data_item.value,
                                     class: "graph_piece"
                                   });

        } else {

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

          var piece_path = makeSVG('path',
                                   {
                                     d: piece_attrs.join(' '),
                                     fill: color,
                                     "data-title": data_item.name,
                                     "data-value": data_item.value,
                                     class: "graph_piece"
                                   });

        }

        svg.append(piece_path);
        start_x = end_x_outer;
        start_y = end_y_outer;
        start_angle = (start_angle - arc_length) > 0 ?  (start_angle - arc_length) % (2*PI) : start_angle - arc_length + 2*PI;

        key_data.push({
                        'color': color,
                        'title': data_item.name,
                        'percentage': Math.round(100*(data_item.value / data_total))
                      });
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
        var center_large = makeSVG('text',
                                   {
                                     x: outer_radius,
                                     y: outer_radius + inner_radius*3/4 + donut_thickness/2,
                                     'text-anchor': 'middle',
                                     class:'center_large'
                                   },
                                   prettyNumber(data_total_display) + number_decorator);
        var center_small = makeSVG('text',
                                   {
                                     x: outer_radius,
                                     y: outer_radius * 2 - donut_thickness/2,
                                     fill: secondary_text_color,
                                     'text-anchor': 'middle',
                                     class:'center_small'
                                   },
                                   title);
      } else {
        var center_large = makeSVG('text',
                                   {
                                     x: outer_radius,
                                     y: outer_radius,
                                     'text-anchor': 'middle',
                                     class:'center_large'
                                   },
                                   prettyNumber(data_total_display) + number_decorator);
        var center_small = makeSVG('text',
                                   {
                                     x: outer_radius,
                                     y: outer_radius + inner_radius/4,
                                     fill: secondary_text_color,
                                     'text-anchor': 'middle',
                                     class:'center_small'
                                   },
                                   title);
      }
    }


    svg.append(center_large);
    svg.append(center_small);

    if(has_key){
      var key_line_height = height / key_data.length;
      var key_circle_radius = Math.min(5, key_line_height);
      for(var i=0; i<key_data.length; i++){
        var key_data_item = key_data[i];
        var key_circle = makeSVG('circle',
                                 {
                                   cx: center_x + 2*key_circle_radius,
                                   cy: (i*key_line_height) + key_circle_radius,
                                   r: key_circle_radius,
                                   fill: key_data_item['color'],
                                   class: 'key_circle'
                                 });
        var key_text = makeSVG('text',
                               {
                                 x: center_x + 4*key_circle_radius,
                                 y: i*key_line_height + 1.5*key_circle_radius,
                                 fill: secondary_text_color,
                                 class: 'key_text'
                               },
                               key_data_item.title+' ('+key_data_item.percentage+'%)');
        svg.append(key_circle);
        svg.append(key_text);
      }
    }


    if(!no_tip){
      var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

      element.on('mouseover', 'path.graph_piece, circle.graph_piece', function(e){
        tip.find('span.title').html($(this).data('title'));
        tip.find('span.value').text(prettyNumber($(this).data('value')) + number_decorator);
        tip.show();
      });

      element.on('mouseleave', 'path.graph_piece, circle.graph_piece', function(e){
        tip.hide();
      });

      element.on('mousemove', 'path.graph_piece, circle.graph_piece', function(e){
        tip.css({'left': e.pageX - tip.outerWidth()/2 + 'px', 'top': e.pageY - tip.outerHeight(true) + 'px'});
      });
    }

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
        title = options.title,
        has_key = options.has_key,
        offset_top = title ? 10 : 0,
        outer_radius = Math.min(center_x, center_y - offset_top),
        cos = Math.cos,
        sin = Math.sin,
        PI = Math.PI,
        total_radians = 2*PI;

    var svg = $('<svg width="100%" height="100%" viewBox="0, 0, ' + width +', '+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);

    var one_piece = false;
    var key_data = [];
    var data_total = 0;
    var start_x = outer_radius;
    var start_y = offset_top + outer_radius + outer_radius;
    var start_angle = PI * 3/2;
    for(var i=0; i<data.length; i++){
      data_total += data[i].value;
    }
    if(data.length==1){
      one_piece = true;
    }

    if(data_total > 0){
      for(var i=0; i<data.length; i++){
        var data_item = data[i],
        arc_length = (data_item.value / data_total) * total_radians,
        end_x_outer = outer_radius + outer_radius * (cos(start_angle - arc_length)),
        end_y_outer = offset_top + outer_radius - outer_radius * (sin(start_angle - arc_length)),
        color = colors[i%colors.length],
        arc_outer_sweep,
        arc_inner_sweep;

        if(data_item.value == data_total){
          one_piece = true;
        } else {
          one_piece = false;
        }

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

        if(data_item.value > 0){

            if(one_piece){

              var piece_path = makeSVG('circle',
                                       {
                                         cx: outer_radius,
                                         cy: outer_radius + offset_top,
                                         r: outer_radius,
                                         fill: color,
                                         "data-title": data_item.name,
                                         "data-value": data_item.value,
                                         class: "graph_piece"
                                       });

            } else {

              var piece_attrs = [
                'M',
                outer_radius,
                outer_radius + offset_top,
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
                outer_radius + offset_top,
                'Z'
              ];
              var piece_path = makeSVG('path',
                                       {
                                         d: piece_attrs.join(' '),
                                         fill: color,
                                         "data-title": data_item.name,
                                         "data-value": data_item.value,
                                         class: "graph_piece"
                                       });

            }
        }


        svg.append(piece_path);
        start_x = end_x_outer;
        start_y = end_y_outer;
        start_angle -= arc_length;

        key_data.push({
                        'color': color,
                        'title': data_item.name,
                        'percentage': Math.round(100*(data_item.value / data_total))
                      });
      }
    }

    if(has_key){
      var key_line_height = (height - offset_top) / key_data.length;
      var key_circle_radius = Math.min(5, key_line_height);
      for(var i=0; i<key_data.length; i++){
        var key_data_item = key_data[i];
        var key_circle = makeSVG('circle',
                                 {
                                   cx: center_x + 2*key_circle_radius,
                                   cy: offset_top + (i*key_line_height) + key_circle_radius,
                                   r: key_circle_radius,
                                   fill: key_data_item['color'],
                                   class: 'key_circle'
                                 });
        var key_text = makeSVG('text',
                               {
                                 x: center_x + 4*key_circle_radius,
                                 y: offset_top + i*key_line_height + 1.5*key_circle_radius,
                                 fill: secondary_text_color,
                                 class: 'key_text'
                               },
                               key_data_item.title+' ('+key_data_item.percentage+'%)');
        svg.append(key_circle);
        svg.append(key_text);
      }
    }

    if(title) {
      var graph_title = makeSVG('text',
                                {
                                  x: width/2,
                                  y: 5,
                                  fill: secondary_text_color,
                                  'text-anchor': 'middle',
                                  class:'key_text'
                               },
                               title);
      svg.append(graph_title);
    }

    var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

    element.on('mouseover', 'path.graph_piece, circle.graph_piece', function(e){
      tip.find('span.title').html($(this).data('title'));
      tip.find('span.value').text(prettyNumber($(this).data('value')));
      tip.show();
    });

    element.on('mouseleave', 'path.graph_piece, circle.graph_piece', function(e){
      tip.hide();
    });

    element.on('mousemove', 'path.graph_piece, circle.graph_piece', function(e){
      tip.css({'left': e.pageX - tip.outerWidth()/2 + 'px', 'top': e.pageY - tip.outerHeight(true) + 'px'});
    });

    element.addClass('chart').addClass('pie_chart');
    if(has_key){
      element.addClass('has_key');
    }

    return element;
  };









  $.fn.drawSkew = function(data, options) {
    var element = $(this),
        width = options.has_key ? 200 : 100,
        height = 100,
        colors = options.colors,
        border_color = options.border_color,
        data_max = options.data_max || 10,
        show_fit = options.show_fit
        fit_master = options.fit_master || 0,
        fit_comparison = (fit_master + 1) % 2,
        title = options.title,
        has_key = options.has_key,
        edge_tooltips = options.edge_tooltips || false,
        categories = options.categories || false,
        categories_colors = options.categories_colors,
        dot_radius = 1.5,
        offset_top = !title ? dot_radius*2 : 10,
        offset_bottom = !show_fit ? dot_radius*2 : 10;
        center_x = width/2,
        center_y = height/2,
        inner_radius = Math.min(center_x - dot_radius*2, center_y - (offset_top + offset_bottom)/2),
        outer_radius = inner_radius + dot_radius*2,
        start_x = options.has_key ? inner_radius + dot_radius : center_x,
        start_y = inner_radius + offset_top,
        cos = Math.cos,
        sin = Math.sin,
        PI = Math.PI,
        total_radians = 2*PI;

    var svg = $('<svg width="100%" height="100%" viewBox="0, 0, ' + width +', '+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);
		var outer_circle = makeSVG('circle',
                               {
                                 cx: start_x,
                                 cy: start_y,
                                 r: inner_radius,
                                 stroke: border_color,
                                 "stroke-width": "0.5%",
                                 fill: "none"
                               });
    svg.append(outer_circle);

    var key_data = [];
    var data_points = data[0]['values'].length;
    var angle_step = 2 * PI / data_points;
    var coords = '';
    var start_angle = PI * 1/2;
    var fit_total = 0;
    var tooltip_values = [];
    var tooltip_pieces = [];
    var category_pieces = {};

    var edge_angle = start_angle;
    var category_counter = 0;
    for(var j=0; j<data[0]['values'].length; j++) {
    	var data_item = data[0]['values'][j],
    	coord_x = start_x + inner_radius * (cos(edge_angle)),
      coord_y = start_y - inner_radius * (sin(edge_angle));

      if(edge_tooltips) {
      	var piece_path = makeSVG('circle',
                                 {
                                   cx: coord_x,
                                   cy: coord_y,
                                   r: dot_radius,
                                   fill: border_color,
                                   "data-title": data_item.name,
                                   "data-value": tooltip_values[j].join('<br/>'),
                                   class: "graph_piece"
                                 });
        svg.append(piece_path);
        edge_angle += angle_step;
      }

      if(categories){
        if (typeof(data_item.category) == "string") {
          var category_name = data_item.category;
          var category_subtitle = "";
        }
        else if (typeof(data_item.category) == "object"){
          var category_name = data_item.category.name;
          var category_subtitle = data_item.category.subtitle;
        }
        if(category_name in category_pieces) {
          category_pieces[category_name]['length'] += 1;
        }
        else {
          category_pieces[category_name] = {'length': 1, 'color': categories_colors[category_counter%categories_colors.length], 'value': category_subtitle};
          category_counter++;
        }
      }

      if(show_fit && data.length == 2) {
        fit_total += (1 - ( Math.max(data[fit_master]['values'][j]['value'] - data[fit_comparison]['values'][j]['value'], 0) / data_max ) );
      }
    }

    if(categories && category_pieces) {
      var category_start_angle = start_angle + PI/data_points,
          category_start_x = start_x + outer_radius * (cos(category_start_angle));
          category_start_y = start_y - outer_radius * (sin(category_start_angle));

      for(var category_name in category_pieces) {
        if(category_pieces.hasOwnProperty(category_name)) {
          var category = category_pieces[category_name],
          arc_length = (category.length / data_points) * total_radians,
          end_x_outer = start_x + outer_radius * (cos(category_start_angle - arc_length)),
          end_y_outer = start_y - outer_radius * (sin(category_start_angle - arc_length)),
          end_x_inner = start_x + inner_radius * (cos(category_start_angle - arc_length)),
          end_y_inner = start_y - inner_radius * (sin(category_start_angle - arc_length)),
          color = category.color,
          arc_outer_sweep,
          arc_inner_sweep;

          if(arc_length >= PI){
            arc_outer_sweep = '0 1 1';
            arc_inner_sweep = '0 1 0';
          } else {
            arc_outer_sweep = '0 0 1';
            arc_inner_sweep = '0 0 0';
          }

          var piece_attrs;
          var path_type = 'path';

          if(category_counter == 1){

            var piece_path = makeSVG('circle',
                                     {
                                       cx: start_x,
                                       cy: start_y,
                                       r: inner_radius + dot_radius,
                                       stroke: color,
                                       "stroke-width": dot_radius*2,
                                       fill: "none",
                                       "data-title": category_name,
                                       "data-value": category.value,
                                       class: "graph_piece"
                                     });

          } else {

            piece_attrs = [
              'M',
              category_start_x,
              category_start_y,
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
              start_x + inner_radius * (cos(category_start_angle)),
              start_y - inner_radius * (sin(category_start_angle)),
              'L',
              category_start_x,
              category_start_y,
              'Z'
            ];
            var piece_path = makeSVG('path',
                                     {
                                       d: piece_attrs.join(' '),
                                       fill: color,
                                       "data-title": category_name,
                                       "data-value": category.value,
                                       class: "graph_piece"
                                     });
          }

          svg.append(piece_path);
          category_start_x = end_x_outer;
          category_start_y = end_y_outer;
          category_start_angle = (category_start_angle - arc_length) > 0 ?  (category_start_angle - arc_length) % (2*PI) : category_start_angle - arc_length + 2*PI;
        }
      }
    }

    for(var i=0; i<data.length; i++) {
    	var coords = [];
    	var graph_name = data[i]['title'];
    	var piece_angle = start_angle;
    	for(var j=0; j<data[i]['values'].length; j++) {
        var data_item = data[i]['values'][j],
        coord_x = start_x + (inner_radius * data_item.value/data_max) * (cos(piece_angle)),
        coord_y = start_y - (inner_radius * data_item.value/data_max) * (sin(piece_angle)),
        color = colors[i%colors.length];

        coords.push(coord_x + ',' + coord_y);
        piece_angle += angle_step;
        if(edge_tooltips) {
          if(tooltip_values[j]) {
	          tooltip_values[j].push(graph_name + ": " + data_item.value + "/" + data_max);
	        } else {
		        tooltip_values[j] = [graph_name + ": " + data_item.value + "/" + data_max];
	        }
        }
        else {
          var tooltip_piece_path = makeSVG('circle',
                                           {
                                             cx: coord_x,
                                             cy: coord_y,
                                             r: dot_radius,
                                             fill: color,
                                             "data-title": data_item.name,
                                             "data-value": graph_name + ": " + data_item.value + "/" + data_max,
                                             class: "graph_piece"
                                           });
	        tooltip_pieces.push(tooltip_piece_path);
        }

      }

      var piece_path = makeSVG('polygon',
                               {
                                 points: coords.join(' '),
                                 fill: color,
                                 "fill-opacity": 0.5,
                                 "stroke": color,
                                 "stroke-width": "0.5%",
                                 "data-title": data_item.name,
                                 "data-value": data_item.value,
                                 class: "graph_piece"
                               });
      svg.append(piece_path);

      if(!edge_tooltips) {
        for(var j=0; j<tooltip_pieces.length; j++) {
          svg.append(tooltip_pieces[j]);
        }
      }

      key_data.push({'color': color, 'title': data[i]['title']});
    }

    if(has_key) {
      var key_line_height = (height - offset_top) / key_data.length;
      var key_circle_radius = Math.min(5, key_line_height);
      for(var i=0; i<key_data.length; i++) {
        var key_data_item = key_data[i];
        var key_circle = makeSVG('circle',
                                 {
                                   cx: center_x + 2*key_circle_radius,
                                   cy: offset_top + (i*key_line_height) + key_circle_radius,
                                   r: key_circle_radius,
                                   fill: key_data_item['color'],
                                   class: 'key_circle'
                                 });
        var key_text = makeSVG('text',
                               {
                                 x: center_x + 4*key_circle_radius,
                                 y: offset_top + i*key_line_height + 1.5*key_circle_radius,
                                 fill: secondary_text_color,
                                 class: 'key_text'
                               },
                               key_data_item.title);
        svg.append(key_circle);
        svg.append(key_text);
      }
    }

    if(title) {
      var graph_title = makeSVG('text',
                                {
                                  x: width/2,
                                  y: 5,
                                  fill: secondary_text_color,
                                  'text-anchor': 'middle',
                                  class:'key_text'
                               },
                               title);
      svg.append(graph_title);
    }

    if(show_fit) {
    	var fit_value = prettyNumber(100 * fit_total/data_points)
    	var fit_text = "Fit: " + fit_value + "%";
      var graph_fit = makeSVG('text',
                              {
                                x: width/2,
                                y: height - 2,
                                fill: secondary_text_color,
                                'text-anchor': 'middle',
                                class:'key_text'
                             },
                             fit_text);
      svg.append(graph_fit);
    }


    var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

    element.on('mouseover', 'path.graph_piece, circle.graph_piece', function(e) {
      tip.find('span.title').html($(this).data('title'));
      if($(this).data('value') && !isNaN($(this).data('value'))) {
      	tip.find('span.value').text(prettyNumber($(this).data('value')));
      }
      else {
        tip.find('span.value').html($(this).data('value'));
      }
      tip.show();
    });

    element.on('mouseleave', 'path.graph_piece, circle.graph_piece', function(e) {
      tip.hide();
    });

    element.on('mousemove', 'path.graph_piece, circle.graph_piece', function(e) {
      tip.css({'left': e.pageX - tip.outerWidth()/2 + 'px', 'top': e.pageY - tip.outerHeight(true) + 'px'});
    });

    element.addClass('chart').addClass('skew_chart');
    if(has_key) {
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
        height_adjustment = typeof options.height_adjustment === 'undefined' ? 0 : options.height_adjustment,
        cos = Math.cos,
        sin = Math.sin,
        PI = Math.PI;

    var svg = $('<svg width="100%" height="100%" viewBox="0, 0, ' + width +', '+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);

    var indicator_width = average_line || goal_value !== null ? 16 : 0;
    var indicator_height = average_line || goal_value !== null ? 8 : 0;
    var area_width = width - indicator_width;
    var area_height = hover && !title ? height : height - 10;
    var max_bar_height = area_height - 10;
    var data_total = 0;
    var data_max = 1 + height_adjustment;
    var start_x = width - area_width + bar_spacing/2;
    var start_y = area_height;
    var bar_width = (area_width - ((data.length) * bar_spacing)) / data.length;
    for(var i=0; i<data.length; i++){
      data_total += data[i].value;
      if(data[i].value + height_adjustment > data_max){
        data_max = data[i].value + height_adjustment;
      }
    }

    if(average_line || goal_value !== null){
      var indicated_height;
      if(average_line){
        color_switch = data_total / data.length;
        indicated_height = max_bar_height * (color_switch + height_adjustment) / data_max;
      } else {
        color_switch = goal_value;
        indicated_height = max_bar_height * (goal_value + height_adjustment) / data_max;
      }

      var value_indicator = makeSVG('rect',
                                    {
                                      x: width - area_width,
                                      y: start_y - indicated_height,
                                      width: area_width,
                                      height: indicated_height,
                                      fill: 'rgba(0, 0, 0, 0.1)'
                                   });
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
      var color_switch_indicator = makeSVG('path',
                                           {
                                             d: indicator_path.join(' '),
                                             fill: indicator_color,
                                             class: 'goal_indicator'
                                           });
      svg.append(color_switch_indicator);
      var color_switch_text = makeSVG('text',
                                      {
                                        x: (indicator_width - indicator_height/2)/2,
                                        y: start_y - indicated_height + indicator_height/2 - 2,
                                        'text-anchor': 'middle',
                                        fill: '#fff',
                                        class: 'goal_indicator_text'
                                      },
                                      prettyNumber(color_switch));
      svg.append(color_switch_text);
    }


    if(typeof color_switch !== 'undefined'){

      for(var i=0; i<data.length; i++){
        var data_item = data[i],
        lower_bar_height = max_bar_height * Math.min((data_item.value + height_adjustment), (color_switch + height_adjustment)) / data_max,
        bar_height = max_bar_height * (data_item.value + height_adjustment) / data_max,
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
          var upper_piece_path = makeSVG('path',
                                         {
                                           d: upper_piece_attrs.join(' '),
                                           fill: upper_color,
                                           "data-title": data_item.name,
                                           "data-value": data_item.value,
                                           class: bar_class
                                         });
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
        var lower_piece_path = makeSVG('path',
                                       {
                                         d: lower_piece_attrs.join(' '),
                                         fill: lower_color,
                                         "data-title": data_item.name,
                                         "data-value": data_item.value,
                                         class: bar_class
                                       });
        svg.append(lower_piece_path);


        if(!hover){
          var value_text = makeSVG('text',
                                   {
                                     x: start_x + bar_width/2,
                                     y: start_y - bar_height - 1,
                                     fill: secondary_text_color,
                                     'text-anchor': 'middle',
                                     class: "key_text"
                                   },
                                   prettyNumber(data_item.value));

          var title_text = makeSVG('text',
                                   {
                                     x: start_x + bar_width/2,
                                     y: height - 1,
                                     fill: secondary_text_color,
                                     'text-anchor': 'middle',
                                     class: "key_text"
                                   },
                                   data_item.name);

          svg.append(value_text);
          svg.append(title_text);
        }

        start_x += (bar_width + bar_spacing);

      }

    } else {

      for(var i=0; i<data.length; i++){
        var data_item = data[i],
        bar_height = max_bar_height * (data_item.value + height_adjustment) / data_max,
        color = colors[i%colors.length],
        bar_class = hover ? "graph_piece" : "";

        if(rounded_tops){
          var piece_attrs = [
              'M',
              start_x,
              start_y,
              'L',
              start_x,
              start_y - bar_height + Math.min(bar_width/2, bar_height),
              'A',
              bar_width/2,
              Math.min(bar_width/2, bar_height),
              '0 0 1',
              start_x + bar_width,
              start_y - bar_height + Math.min(bar_width/2, bar_height),
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

        var piece_path = makeSVG('path',
                                 {
                                   d: piece_attrs.join(' '),
                                   fill: color,
                                   "data-title": data_item.name,
                                   "data-value": data_item.value,
                                   class: bar_class
                                 });

        if(bar_height > 0){
          svg.append(piece_path);
        }


        if(!hover){
          var value_text = makeSVG('text',
                                   {
                                     x: start_x + bar_width/2,
                                     y: start_y - bar_height - 1,
                                     fill: secondary_text_color,
                                     'text-anchor': 'middle',
                                     class: "key_text"
                                   },
                                   prettyNumber(data_item.value));

          var title_text = makeSVG('text',
                                   {
                                     x: start_x + bar_width/2,
                                     y: height - 1,
                                     fill: secondary_text_color,
                                     'text-anchor': 'middle',
                                     class: "key_text"
                                   }, data_item.name);

          svg.append(value_text);
          svg.append(title_text);
        }

        start_x += (bar_width + bar_spacing);
      }

    } /* end non-colorchange */

    if(hover && title){
      var graph_title = makeSVG('text',
                                {
                                  x: width/2,
                                  y: height - 2,
                                  fill: secondary_text_color,
                                  'text-anchor': 'middle',
                                  class:'key_text'
                                }, title);
    }




    svg.append(graph_title);

    if(hover){

      var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

      element.on('mouseover', 'path.graph_piece', function(e){
        tip.find('span.title').html($(this).data('title'));
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









  $.fn.drawLine = function(data, options){
    var element = $(this),
        //width = options.width.indexOf('%') > -1 ? (element.width() * parseInt(options.width) / 100) : parseInt(options.width),
        //height = options.height.indexOf('%') > -1 ? (element.height() * parseInt(options.height) / 100) : parseInt(options.height),
        aspect_ratio = options.aspect_ratio ? options.aspect_ratio : 2,
        width = 100 * aspect_ratio,
        height = 100,
        colors = options.colors,
        background_color = options.background_color || '#fff',
        title = options.title,
        hover = options.hover,
        dot_radius = 1.5,
        separate_scales = options.separate_scales ? options.separate_scales : false,
        height_adjustment = typeof options.height_adjustment === 'undefined' ? 0 : options.height_adjustment,
        cos = Math.cos,
        sin = Math.sin,
        PI = Math.PI;

    var svg = $('<svg width="100%" height="100%" viewBox="0, 0, ' + width +', '+ height +'" xmlns="http://www.w3.org/2000/svg"></svg>').appendTo(element);

    var area_width = width - 2 * dot_radius;
    var area_height = hover && !title ? height : height - 10;
    var max_point_height = area_height - 10;
    var data_max = null;
    var data_min = null;
    var data_maxes = [];
    var data_mins = [];

    for(var j=0; j<data.length; j++) {
      data_maxes.push(null);
      data_mins.push(null);
      for(var i=0; i<data[j].length; i++){
        if(data_max == null || data[j][i].value > data_max){
          data_max = data[j][i].value;
        }
        if(data_min == null || data[j][i].value < data_min){
          data_min = data[j][i].value;
        }

        if(data_maxes[j] == null || data[j][i].value > data_maxes[j]){
          data_maxes[j] = data[j][i].value;
        }
        if(data_mins[j] == null || data[j][i].value < data_mins[j]){
          data_mins[j] = data[j][i].value;
        }
      }
    }
    height_adjustment = Math.max((-1*data_min), height_adjustment);
    data_max = data_max + height_adjustment;
    data_min = data_min + height_adjustment;
    for(var j=0; j<data.length; j++) {
      height_adjustment = Math.max((-1*data_mins[j]), height_adjustment);
      data_maxes[j] = data_maxes[j] + height_adjustment;
      data_mins[j] = data_mins[j] + height_adjustment;
    }
    var dots = [];

    for(var j=0; j<data.length; j++) {
      var point_spacing = data[j].length > 1 ? area_width / (data[j].length - 1) : area_width,
          start_x = (width - area_width)/2,
          start_y = area_height,
          coords = [],
          color = colors[j],
          line_data_max = separate_scales ? data_maxes[j] : data_max;

      for(var i=0; i<data[j].length; i++){
        var data_item = data[j][i],
            coord_x = start_x,
            coord_y = area_height - max_point_height * (data_item.value + height_adjustment) / line_data_max,
            tooltip_value = data_item.value;

        if (data_item.hasOwnProperty('tooltip_value')) {
          if (data_item.tooltip_value.constructor == Array) {
            tooltip_value = data_item.tooltip_value.join(', ');
          } else {
            tooltip_value = data_item.tooltip_value;
          }
        }

        coords.push(coord_x + ',' + coord_y);

        var dot_path = makeSVG('circle',
                               {
                                 cx: coord_x,
                                 cy: coord_y,
                                 r: dot_radius,
                                 fill: color,
                                 "data-title": data_item.name,
                                 "data-value": tooltip_value,
                                 class: "graph_piece"
                               });

        dots.push(dot_path);


        start_x += point_spacing;
      }

      var fill_start_coord = dot_radius + ',' + area_height;
      var fill_end_coord = dot_radius + area_width + ',' + area_height;

      var line_path = makeSVG('polygon',
                               {
                                 points: fill_start_coord + ' ' + coords.join(' ') + ' ' + fill_end_coord,
                                 fill: color,
                                 "fill-opacity": 0.5
                               });

      var fill_path = makeSVG('polyline',
                              {
                                points: coords.join(' '),
                                fill: "none",
                                "fill-opacity": 0.5,
                                "stroke": color,
                                "stroke-width": "0.5%"
                              });
      svg.append(fill_path);
      svg.append(line_path);
    }
    for (k=0; k<dots.length; k++){
      svg.append(dots[k]);
    }


    if(hover && title){
      var graph_title = makeSVG('text',
                                {
                                  x: width/2,
                                  y: height - 2,
                                  fill: secondary_text_color,
                                  'text-anchor': 'middle',
                                  class:'key_text large'
                                }, title);
    }




    svg.append(graph_title);

    if(hover){

      var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

      element.on('mouseover', 'polygon.graph_piece, circle.graph_piece', function(e){
        tip.find('span.title').html($(this).data('title'));
        tip.find('span.value').text($(this).data('value'));
        tip.show();
      });

      element.on('mouseleave', 'polygon.graph_piece, circle.graph_piece', function(e){
        tip.hide();
      });

      element.on('mousemove', 'polygon.graph_piece, circle.graph_piece', function(e){
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

    var data_total=0,
    display_total = 0;
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
        piece_percentage = (data_item.value/data_total) * (area_height / 100),
        piece_width = Math.round(piece_percentage * width * 100) / 100,
        piece_height = Math.round(piece_percentage * height * 100) / 100;

        display_total += percentage;
        if(display_total > 1){
          percentage -= 0.01;
        }


        var piece_path = makeSVG('path',
                                 {
                                   d: shape,
                                   fill: color,
                                   "data-title": data_item.name,
                                   "data-value": Math.round(percentage * 100) + '%',
                                   class: piece_class,
                                   transform: 'translate('+ start_x +', '+ (start_y - piece_height) +'), scale('+ piece_percentage + ')'
                                 });
        svg.append(piece_path);


        if(!hover){
          var value_text = makeSVG('text',
                                   {
                                     x: start_x + piece_width/2,
                                     y: start_y - piece_height - 1,
                                     fill: secondary_text_color,
                                     'text-anchor': 'middle',
                                     class: "key_text large"
                                   },
                                   Math.round(percentage * 100) + '%');

          var title_text = makeSVG('text',
                                   {
                                     x: start_x + piece_width/2,
                                     y: height - 1,
                                     fill: secondary_text_color,
                                     'text-anchor': 'middle',
                                     class: "key_text"
                                   },
                                   data_item.name);

          svg.append(value_text);
          svg.append(title_text);
        }

        start_x += piece_width;

        if(title){
          start_x += (10 / (data.length - 1));
        }
      }
    }


    if(hover && title){
      var graph_title = makeSVG('text',
                                {
                                  x: width/2,
                                  y: height - 2,
                                  fill: secondary_text_color,
                                  'text-anchor': 'middle',
                                  class:'key_text'
                                },
                                title);
    }

    svg.append(graph_title);

    if(hover){

      var tip = $('<div class="chart_tip"><span class="title"></span><span class="value"></span></div>').appendTo('body');

      element.on('mouseover', 'path.graph_piece', function(e){
        tip.find('span.title').html($(this).data('title'));
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
