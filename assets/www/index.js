$(document).ready(function() {   

    // global vars
    var face_number = 0;                // current face displayed
    var face_tags = new Array();        // face tags (attributes etc)

    function sendImage(src_) {
        var src=src_;  // assign to global variable
        var imageData;
        var face_url = 'http://www.sciencemuseum.org.uk/WhoAmI/FindOutMore/Yourbrain/Whatareemotions/~/media/WhoAmI/FindOutMore/W/Whichoneishappysurprisedfearfulsaddisgustedorangry1-1-8-2-0-0-0-0-0-0-0.jpg';
        
        if (src == 'url_offline') face_url='debug/testimage.jpg';

        function success_fileupload(r) {
                console.log("Code = " + r.responseCode);
                console.log("Response = " + r.response);
                console.log("Sent = " + r.bytesSent);
                
                var data=$.parseJSON(r.response);
                
                success_upload(data);
        }
        function fail_fileupload(error) {
            $.mobile.hidePageLoadingMsg();
            $('#face_server_error').html("An error has occurred: Code = " + error.code + "(" + error.message + ")");
            $('#face_server_error').show();
        }

        function success_upload(data) {
                $.mobile.hidePageLoadingMsg();
                
                if (data['status']!='success') {
                    $('#face_server_error').html("An error has occurred: Code = " + data['error_code'] + "(" + data['error_message'] + ")");
                    $('#face_server_error').show();
                }
                else {
                    // change page (and get back to default status on first page)
                    $('#face_server').hide();
                    $('.face_list_none').hide();
                    $('.face_list_some').show();
                    $('.face_list_number').remove();
                    $(".face_list_entry").remove();
                    
                    if (imageData)
                        //$('#face_image').attr('src', 'data:image/jpeg;base64,' + imageData);
                        $('#face_image').attr('src', imageData);
                    else
                        $('#face_image').attr('src', face_url);

                    face_tags=data['photos'][0]['tags'];
                    $('.face_upload').hide();
                    $('.face_count').html(face_tags.length);
                    $('.face_result').show();

                    // iterate over detected faces
                    for (var j=0; j<face_tags.length; j++) {
                        var face_attributes=["age_est","age_min","age_max","gender","lips","smiling","mood","glasses"];
                        for (var k=0; k<face_attributes.length; k++) {
                            face_tpl='.face_list_template .'+face_attributes[k];
                            if (face_tags[j]["attributes"][face_attributes[k]]) {
                                $(face_tpl).html(face_tags[j]["attributes"][face_attributes[k]]["value"]);
                                if (face_tags[j]["attributes"][face_attributes[k]]["confidence"] < 60) {
                                    $(face_tpl).parent(".face_list_attribute").addClass('low_confidence');
                                }
                            }
                        }
                        $('.face_list_template .face_number').html(j+1);
                        $('.face_list').append($('.face_list_template').clone());
                        $('.face_list .face_list_template').attr('id', "face_list_"+(j+1));
                        $('.face_list .face_list_template').addClass("face_list_entry");
                        $('.face_list .face_list_template').removeClass("face_list_template");
                    }
                    
                    if (face_tags.length==0) {
                        $('.face_list_some').hide();
                        $('.face_list_none').show();
                    }

                    // show result page
                    $.mobile.changePage('#result', {transition: "slide", reverse: false });

                    // display first face
                    face_list_entry(0);
                    
                    $('#face_image').load(function() { image_face_positions(face_tags); });
                }
                
                
                function image_face_positions(face_tags) {
                    var face_image_offset=$('#face_image').position();
                    var face_image_width=$('#face_image').width();
                    var face_image_height=$('#face_image').height();
                    var face_image_original_width=data['photos'][0]['width'];
                    var face_image_original_height=data['photos'][0]['height'];
                    //// we need to compute the image height. the image may not yet be loaded, thus it can be undefined from css.
                    //// width is defined as it is set to 100%
                    //var face_image_height=face_image_width/face_image_original_width*face_image_original_height;

                    for (var j=0; j<face_tags.length; j++) {
                        $(".face_list_number_template .face_number").html(j+1);
                        $('.face_list_image_container').append($('.face_list_number_template').clone());
                        var x=face_image_offset.left+(face_tags[j]["center"]["x"]/100*face_image_width);
                        var y=face_image_offset.top+(face_tags[j]["center"]["y"]/100*face_image_height);
                        //$('.face_list_number .face_list_number_template').offset({ top: y, left: x });
                        $('.face_list_image_container .face_list_number_template').show();
                        var f_width=face_tags[j]["width"];
                        var f_height=face_tags[j]["height"];
                        var f_x=face_tags[j]["center"]["x"]-f_width/2;
                        var f_y=face_tags[j]["center"]["y"]-f_height/2;
                        $('.face_list_image_container .face_list_number_template').css('left', f_x+'%');
                        $('.face_list_image_container .face_list_number_template').css('top', f_y+'%');
                        $('.face_list_image_container .face_list_number_template').css('width', f_width+'%');
                        $('.face_list_image_container .face_list_number_template').css('height', f_height+'%');
                        $('.face_list_image_container .face_list_number_template').attr('id', "face_list_number_"+(j+1));
                        $('.face_list_image_container .face_list_number_template').addClass("face_list_number");
                        $('.face_list_image_container .face_list_number_template').removeClass("face_list_number_template");
                    }
            
                }
         }

        // Successfully aquired image data -> base64 encoded string of the image file
        function success_picture(imageData_) {
            imageData=imageData_;  // assign to global variable
            var url = 'http://api.face.com/faces/detect.json';
            var params = {
                //image: imageData,
                api_key: CONFIG_api_key,
                api_secret: CONFIG_api_secret,
                //urls: face_url,
                detector: 'Normal',
                attributes: 'all'
            };
            
            // clear error messages
            $('#face_server_error').html("");
            $('#face_server_error').hide();
            
            if (src == 'url' || src == 'url_offline') {
                params['urls']=face_url;
                //$('#face_server').show();
                $.mobile.showPageLoadingMsg("a","working...");
                if (src == 'url_offline')
                    success_upload(debug_post_offline());
                else
                    $.post(url, params, success_upload, 'json');
            }
            else {
                var options = new FileUploadOptions();
                options.fileKey="file";
                options.fileName=imageData.substr(imageData.lastIndexOf('/')+1);
                options.mimeType="image/jpeg";
    
                options.params = params;
                options.chunkedMode = false;
    
                var ft = new FileTransfer();
                //$('#face_server').show();
                $.mobile.showPageLoadingMsg("a","working...");
                ft.upload(imageData, url, success_fileupload, fail_fileupload, options);
            }
            
        }
        
        function fail_picture(message) {
            return false;
            //alert(message);
        }
        
        // Aquire the image -> Phonegap API
        if (src == 'url' || src == 'url_offline') {
            success_picture(false);
        }
        else {
            // Set the image source [library || camera]
            if (src == 'library')
                navigator.camera.getPicture(success_picture, fail_picture, {correctOrientation: true, sourceType: Camera.PictureSourceType.PHOTOLIBRARY, destinationType: navigator.camera.DestinationType.FILE_URI});
            else
                navigator.camera.getPicture(success_picture, fail_picture, {quality: 75, targetWidth: 1280, targetHeight: 1280, correctOrientation: true, sourceType: Camera.PictureSourceType.CAMERA, destinationType: navigator.camera.DestinationType.FILE_URI});
        }
    }
    


    function debug_post_offline() {
        var json='  \
        {"photos":[{"url":"http:\/\/www.sciencemuseum.org.uk\/WhoAmI\/FindOutMore\/Yourbrain\/Whatareemotions\/~\/media\/WhoAmI\/FindOutMore\/W\/Whichoneishappysurprisedfearfulsaddisgustedorangry1-1-8-2-0-0-0-0-0-0-0.jpg","pid":"F@456ca444528f0973fe6787ab629291fa_4b4b4c6d54c37","width":360,"height":240,"tags":[ \
        {"tid":"TEMP_F@456ca444528f0973fe6787ab629291fa_4b4b4c6d54c37_14.17_31.67_0_1","recognizable":true,"threshold":null,"uids":[],"gid":null,"label":"","confirmed":false,"manual":false,"tagger_id":null,"width":19.44,"height":29.17,"center":{"x":14.17,"y":31.67},"eye_left":{"x":11.78,"y":22.84},"eye_right":{"x":19.79,"y":28.1},"mouth_left":{"x":9.47,"y":36.59},"mouth_center":{"x":12.42,"y":39.4},"mouth_right":{"x":15.11,"y":40.18},"nose":{"x":14.33,"y":32.39},"ear_left":null,"ear_right":null,"chin":null,"yaw":0.06,"roll":22.06,"pitch":-3.45,"attributes":{"age_est":{"value":10,"confidence":82},"age_max":{"value":14,"confidence":82},"age_min":{"value":4,"confidence":82},"face":{"value":"true","confidence":89},"gender":{"value":"female","confidence":71},"glasses":{"value":"false","confidence":46},"lips":{"value":"parted","confidence":77},"mood":{"value":"surprised","confidence":87},"smiling":{"value":"false","confidence":69}}}, \
        {"tid":"TEMP_F@456ca444528f0973fe6787ab629291fa_4b4b4c6d54c37_17.78_79.17_0_1","recognizable":true,"threshold":null,"uids":[],"gid":null,"label":"","confirmed":false,"manual":false,"tagger_id":null,"width":17.78,"height":26.67,"center":{"x":17.78,"y":79.17},"eye_left":{"x":12.13,"y":73.16},"eye_right":{"x":20.98,"y":72.81},"mouth_left":{"x":13.58,"y":85.77},"mouth_center":{"x":17.26,"y":86.02},"mouth_right":{"x":20.83,"y":85.29},"nose":{"x":16.55,"y":79.8},"ear_left":null,"ear_right":null,"chin":null,"yaw":2.28,"roll":-4.91,"pitch":-5.32,"attributes":{"age_est":{"value":34,"confidence":95},"age_max":{"value":47,"confidence":95},"age_min":{"value":25,"confidence":95},"face":{"value":"true","confidence":98},"gender":{"value":"female","confidence":92},"glasses":{"value":"false","confidence":55},"lips":{"value":"sealed","confidence":52},"mood":{"value":"angry","confidence":32},"smiling":{"value":"false","confidence":82}}}, \
        {"tid":"TEMP_F@456ca444528f0973fe6787ab629291fa_4b4b4c6d54c37_48.89_32.92_0_1","recognizable":true,"threshold":null,"uids":[],"gid":null,"label":"","confirmed":false,"manual":false,"tagger_id":null,"width":21.67,"height":32.5,"center":{"x":48.89,"y":32.92},"eye_left":{"x":45.75,"y":23.56},"eye_right":{"x":54.53,"y":27.21},"mouth_left":{"x":44.03,"y":38.51},"mouth_center":{"x":47.09,"y":39.5},"mouth_right":{"x":51.15,"y":40.99},"nose":{"x":47.66,"y":34.15},"ear_left":null,"ear_right":null,"chin":null,"yaw":7.44,"roll":14.32,"pitch":-6.86,"attributes":{"age_est":{"value":34,"confidence":95},"age_max":{"value":39,"confidence":95},"age_min":{"value":30,"confidence":95},"face":{"value":"true","confidence":96},"gender":{"value":"male","confidence":48},"glasses":{"value":"false","confidence":68},"lips":{"value":"sealed","confidence":81},"mood":{"value":"angry","confidence":48},"smiling":{"value":"false","confidence":92}}}, \
        {"tid":"TEMP_F@456ca444528f0973fe6787ab629291fa_4b4b4c6d54c37_50.97_81.88_0_1","recognizable":true,"threshold":null,"uids":[],"gid":null,"label":"","confirmed":false,"manual":false,"tagger_id":null,"width":16.94,"height":25.42,"center":{"x":50.97,"y":81.88},"eye_left":{"x":45.39,"y":79.55},"eye_right":{"x":53.49,"y":73.61},"mouth_left":{"x":49.37,"y":89.72},"mouth_center":{"x":53.1,"y":89.31},"mouth_right":{"x":56.68,"y":84.52},"nose":{"x":51.23,"y":85.05},"ear_left":null,"ear_right":null,"chin":null,"yaw":9.06,"roll":-28.15,"pitch":-8.84,"attributes":{"age_est":{"value":23,"confidence":98},"age_max":{"value":28,"confidence":98},"age_min":{"value":20,"confidence":98},"face":{"value":"true","confidence":98},"gender":{"value":"female","confidence":74},"glasses":{"value":"false","confidence":76},"lips":{"value":"parted","confidence":92},"mood":{"value":"happy","confidence":75},"smiling":{"value":"true","confidence":97}}}, \
        {"tid":"TEMP_F@456ca444528f0973fe6787ab629291fa_4b4b4c6d54c37_82.78_79.58_0_1","recognizable":true,"threshold":null,"uids":[],"gid":null,"label":"","confirmed":false,"manual":false,"tagger_id":null,"width":21.67,"height":32.5,"center":{"x":82.78,"y":79.58},"eye_left":{"x":78.29,"y":72.26},"eye_right":{"x":87.45,"y":71.59},"mouth_left":{"x":78.25,"y":87.19},"mouth_center":{"x":82.34,"y":86.98},"mouth_right":{"x":86.96,"y":87.32},"nose":{"x":82.39,"y":80.69},"ear_left":null,"ear_right":null,"chin":null,"yaw":1.94,"roll":-0.86,"pitch":-1.05,"attributes":{"age_est":{"value":53,"confidence":95},"age_max":{"value":64,"confidence":95},"age_min":{"value":44,"confidence":95},"face":{"value":"true","confidence":97},"gender":{"value":"male","confidence":82},"glasses":{"value":"false","confidence":80},"lips":{"value":"sealed","confidence":90},"mood":{"value":"sad","confidence":58},"smiling":{"value":"false","confidence":91}}}, \
        {"tid":"TEMP_F@456ca444528f0973fe6787ab629291fa_4b4b4c6d54c37_83.06_30.00_0_1","recognizable":true,"threshold":null,"uids":[],"gid":null,"label":"","confirmed":false,"manual":false,"tagger_id":null,"width":19.44,"height":29.17,"center":{"x":83.06,"y":30},"eye_left":{"x":79.06,"y":23.11},"eye_right":{"x":87.53,"y":23.57},"mouth_left":{"x":79.82,"y":37.75},"mouth_center":{"x":83.42,"y":38.66},"mouth_right":{"x":87.34,"y":37.34},"nose":{"x":83.54,"y":30.17},"ear_left":null,"ear_right":null,"chin":null,"yaw":-2.46,"roll":1.34,"pitch":-0.3,"attributes":{"age_est":{"value":18,"confidence":90},"age_max":{"value":24,"confidence":90},"age_min":{"value":12,"confidence":90},"face":{"value":"true","confidence":99},"gender":{"value":"female","confidence":72},"glasses":{"value":"false","confidence":80},"lips":{"value":"parted","confidence":98},"mood":{"value":"surprised","confidence":49},"smiling":{"value":"true","confidence":46}}}]}], \
        "status":"success","usage":{"used":352,"remaining":"unlimited","limit":"unlimited","reset_time_text":"unlimited","reset_time":0}}  \
        ';
        return $.parseJSON(json);
    }



    // gui functions
    
    function face_list_entry(number) {
        if (number=="next")
            number=face_number+1;
        else if (number=="prev")
            number=face_number-1;
        if ($('#face_list_'+number).length>0) {
            $('.face_list_entry_active').hide();
            $('.face_list_entry_active').removeClass('face_list_entry_active');
            $('#face_list_'+number).fadeIn(600);
            $('#face_list_'+number).addClass('face_list_entry_active');
            if (number == 0)  // zoom to full view
            {
                $('.face_list_image_container').zoomTo({root: $('.face_list_image_container'), targetsize:1.0});
                $('h3.face_number').show();
            }
            else
            {
                $('#face_list_number_'+number).zoomTo({root: $('.face_list_image_container'), scalemode: 'both' });
                $('h3.face_number').hide();
            }

            face_number=number;
            if (face_number<=0)
              $('.face_list_prev').addClass('face_list_prev_inactive');
            else
              $('.face_list_prev').removeClass('face_list_prev_inactive');
            if (face_number>=face_tags.length)
              $('.face_list_next').addClass('face_list_next_inactive');
            else
              $('.face_list_next').removeClass('face_list_next_inactive');
        }
    }



    // events

    $('.send-image').click(function () {
        $('.send-image').addClass('ui-disabled'); 
        sendImage($(this).val());
        $('.send-image').removeClass('ui-disabled');
    }); 
    $('#start_reload').click(function () { location.reload();  }); 
    $('#start_debug').click(function () { sendImage("url");  }); 
    $('#start_debug_offline').click(function () { sendImage("url_offline" );  });
    
    $('#face_list_prev_button').click(function () { face_list_entry("prev");  });
    $('#face_list_next_button').click(function () { face_list_entry("next");  });
    
    $('.face_list_data_container').swipeleft(function () { face_list_entry("next");  });
    $('.face_list_data_container').swiperight(function () { face_list_entry("prev");  });

    //$('.zoomTarget').click(function(evt) { $(this).zoomTo({root: $('.face_result')}); evt.stopPropagation(); });
    //$('body').click(function(evt) { $(this).zoomTo({targetsize:1.0}); evt.stopPropagation(); });

    // gui events
    
    // adjust height of prev/next links
    $('#result').live('pageshow', function () {
        if ($('.face_list_prev').height() < $('.face_list').height()) {
            $('.face_list_prev').height($('.face_list').height());
            $('.face_list_next').height($('.face_list').height());
            $('.face_list_prev img').height(0.8*$('.face_list').height());
            $('.face_list_next img').height(0.8*$('.face_list').height());
        }
    });
    
    // gui adjustments
    if (CONFIG_debug) $('.debug').show();
        
});
