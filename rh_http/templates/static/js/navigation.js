// A $( document ).ready() block.

function render_cleditor() {
    var editor = $("#articleText").cleditor({
        controls: // controls to add to the toolbar
            "bold italic underline strikethrough subscript superscript | font size " +
            "style | color highlight removeformat | bullets numbering | outdent " +
            "indent | alignleft center alignright justify | undo redo | " +
            "rule image link unlink | cut copy paste pastetext",
        colors: // colors in the color popup
            "FFF FCC FC9 FF9 FFC 9F9 9FF CFF CCF FCF " +
            "CCC F66 F96 FF6 FF3 6F9 3FF 6FF 99F F9F " +
            "BBB F00 F90 FC6 FF0 3F3 6CC 3CF 66C C6C " +
            "999 C00 F60 FC3 FC0 3C0 0CC 36F 63F C3C " +
            "666 900 C60 C93 990 090 399 33F 60C 939 " +
            "333 600 930 963 660 060 366 009 339 636 " +
            "000 300 630 633 330 030 033 006 309 303",
        fonts: // font names in the font popup
            "Arial,Arial Black,Comic Sans MS,Courier New,Narrow,Garamond," +
            "Georgia,Impact,Sans Serif,Serif,Tahoma,Trebuchet MS,Verdana",
        sizes: // sizes in the font size popup
            "1,2,3,4,5,6,7",
        styles: // styles in the style popup
            [["Paragraph", "<p>"], ["Header 1", "<h1>"], ["Header 2", "<h2>"],
            ["Header 3", "<h3>"],  ["Header 4","<h4>"],  ["Header 5","<h5>"],
            ["Header 6","<h6>"]],
        useCSS: false, // use CSS to style HTML when possible (not supported in ie)
        docType: // Document type contained within the editor
            '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
        docCSSFile: // CSS file used to style the document contained within the editor
            "",
        bodyStyle: // style to assign to document body contained within the editor
            "margin:4px; font:10pt Arial,Verdana; cursor:text"
    });
}
$( document ).ready(function() {

    let stages = new Object();
    stages.reg = $(".registration");
    stages.test = $(".test-no-media");
    stages.testMedia = $(".test-media");
    stages.table = $(".table-stage");
    stages.table2 = $(".table-stage2");
    stages.table3 = $(".table-stage3");
    stages.table4 = $(".table-stage4");
    stages.table5 = $(".table-stage5");
    stages.table6 = $(".table-stage6");
    stages.table7 = $(".table-stage7");
    stages.table8 = $(".table-stage8");
    stages.table9 = $(".table-stage9");

    stages.slider = $(".slider-wrapper");

    $(".menuItem").on("click", function(){
      stages.slider.hide();
    });
   $("#table-stage").on("click", function(){
      stages.slider.hide();
        
    }); 
     $("#table-stage3").on("click", function(){
      stages.slider.hide();
        
    }); 
     $("#table-stage5").on("click", function(){
      stages.slider.hide();
    });

   $("#table-stage7").on("click", function(){
      stages.slider.hide();
        
   });

    $("#reg").on("click", function(){
        stages.slider.hide();
        $(".stage").removeClass("active-stage");
        stages.reg.addClass("active-stage");
        change_content('registration')
    });

    $("#test").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.test.addClass("active-stage");
    });

    $("#test-media").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.testMedia.addClass("active-stage");
    });

    $("#slider").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.slider.addClass("active-stage");
    });

    $("#table-stage").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.table.addClass("active-stage");
    });
    
    $("#table-stage2").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.table2.addClass("active-stage");
    });
    
    $("#table-stage3").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.table3.addClass("active-stage");
    });
     $("#table-stage4").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.table4.addClass("active-stage");
    });
     $("#table-stage5").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.table5.addClass("active-stage");
    });
       $("#table-stage6").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.table6.addClass("active-stage");
    });
        $("#table-stage7").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.table7.addClass("active-stage");
    });
     $("#table-stage8").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.table8.addClass("active-stage");
    });
      $("#table-stage9").on("click", function(){
        $(".stage").removeClass("active-stage");
        stages.table9.addClass("active-stage");
    });
    
    $("#backQue").on("click", function(){
        $("#queCount").text("1/5");
        $("#que1").text("Другой вопрос1?");
        $("#que2").text("Другой вопрос2?");
        $(".answertext").text("Другой ответ");


    });
   $("#nextQue").on("click", function(){
        $("#queCount").text("3/5");
        $("#que1").text("Другой вопрос3?");
        $("#que2").text("Другой вопрос4?");
        $(".answertext").text(" Другой ответ2Другой ответ2Другой ответ2Другой ответ2");
   });
    
    $(".firstLvlBtn").on("click", function(){
        $(".menuActive").removeClass("menuActive");
        $(this).addClass("menuActive");
    });

    if($("#newOrg").is(':checked'))
        $("#frame").html("<input style=\"width:100%;\" type=\"text\" placeholder=\"Название ораганизации\">");
    else
        $("#frame").html("<select class=\"selectOrg\"  size=\"1\" name=\"hero[]\"> <option selected disabled value=\"org\">Выбрать организацию</option><option class=\"optOrg\" value=\"Чебурашка\">Чебурашка</option> <option class=\"optOrg\" value=\"Крокодил Гена\">Крокодил Гена</option><option class=\"optOrg\" value=\"Шапокляк\">Шапокляк</option><option class=\"optOrg\" value=\"Крыса Лариса\">Крыса Лариса</option></select>");
 
    
    $("#newOrg").change(function () {
        if($("#newOrg").is(':checked'))
            $("#frame").html("<input style=\"width:100%;\" type=\"text\" placeholder=\"Название ораганизации\">");
        else
            $("#frame").html("<select class=\"selectOrg\"  size=\"1\" name=\"hero[]\"> <option selected disabled value=\"org\">Выбрать организацию</option><option class=\"optOrg\" value=\"Чебурашка\">Чебурашка</option> <option class=\"optOrg\" value=\"Крокодил Гена\">Крокодил Гена</option><option class=\"optOrg\" value=\"Шапокляк\">Шапокляк</option><option class=\"optOrg\" value=\"Крыса Лариса\">Крыса Лариса</option></select>");
    });
    
    $(".logo").on("click", function(){
        stages.slider.show();
        $(".stage").removeClass("active-stage");
    });
    render_cleditor()
//    var editor = $("#articleText").cleditor({
//        controls: // controls to add to the toolbar
//            "bold italic underline strikethrough subscript superscript | font size " +
//            "style | color highlight removeformat | bullets numbering | outdent " +
//            "indent | alignleft center alignright justify | undo redo | " +
//            "rule image link unlink | cut copy paste pastetext",
//        colors: // colors in the color popup
//            "FFF FCC FC9 FF9 FFC 9F9 9FF CFF CCF FCF " +
//            "CCC F66 F96 FF6 FF3 6F9 3FF 6FF 99F F9F " +
//            "BBB F00 F90 FC6 FF0 3F3 6CC 3CF 66C C6C " +
//            "999 C00 F60 FC3 FC0 3C0 0CC 36F 63F C3C " +
//            "666 900 C60 C93 990 090 399 33F 60C 939 " +
//            "333 600 930 963 660 060 366 009 339 636 " +
//            "000 300 630 633 330 030 033 006 309 303",
//        fonts: // font names in the font popup
//            "Arial,Arial Black,Comic Sans MS,Courier New,Narrow,Garamond," +
//            "Georgia,Impact,Sans Serif,Serif,Tahoma,Trebuchet MS,Verdana",
//        sizes: // sizes in the font size popup
//            "1,2,3,4,5,6,7",
//        styles: // styles in the style popup
//            [["Paragraph", "<p>"], ["Header 1", "<h1>"], ["Header 2", "<h2>"],
//            ["Header 3", "<h3>"],  ["Header 4","<h4>"],  ["Header 5","<h5>"],
//            ["Header 6","<h6>"]],
//        useCSS: false, // use CSS to style HTML when possible (not supported in ie)
//        docType: // Document type contained within the editor
//            '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
//        docCSSFile: // CSS file used to style the document contained within the editor
//            "",
//        bodyStyle: // style to assign to document body contained within the editor
//            "margin:4px; font:10pt Arial,Verdana; cursor:text"
//    });
});
