main = document.getElementById('main_content')
control_tests_block = document.getElementById('control_tests')
simple_tests_block = document.getElementById('simple_tests')

logout_button = document.getElementById('logout')

let timeout_test_timer;


// search_block
search_input = document.getElementById('search_input')
search_submit = document.getElementById('search_submit')
if (search_submit)
    search_submit.addEventListener('click', function(event) {
        event.preventDefault()
        change_content('search_list', search_input.value)
    });

// end search_block

function check_test_important_fields() {
    imp = document.getElementById('test_important')
    notImp = document.getElementById('test_notImportant')
    if (notImp.checked == true) {
        document.getElementById('block_test_status').hidden = true
    } else {
        document.getElementById('block_test_status').hidden = false
    }
}

function check_test_isClosed_fields() {
    if (test_audience_field.value == 'Общий тест') {
        document.getElementById('block_test_tradable').hidden = true
    } else {
        document.getElementById('block_test_tradable').hidden = false
    }
}

function get_test() {
    function get_question(element, index) {
        function get_answer(element, index) {
            return {
                index : index,
                text : element.getElementsByClassName('answer_text')[0].value,
                isRight : element.getElementsByClassName('answer_rights')[0].checked
            }
        }
        question = {
            index : index,
            text : element.getElementsByClassName('question_text')[0].value,
            media_url : element.getElementsByClassName('question_media_url')[0].value,
            answers : []
        }
        answers = element.getElementsByClassName('answer')
        Array.from(answers).forEach(function(record, index){
            question.answers.push(get_answer(record, index+1));
        });
        good_flag = false
        question.answers.forEach(function(answer) {
            if (answer.isRight)
                good_flag = true
        });
        if (good_flag)
            return question
        else
            return undefined
    }
    test = {
        title : document.getElementById('test_title').value,
        description : document.getElementById('test_description').value,
        important : document.getElementById('test_important').checked,
        audience : (document.getElementById('test_audience').value == "Общий тест")? null : document.getElementById('test_audience').value,
        category_id : document.getElementById('test_category').value,
        expired : (document.getElementById('test_expired_number') == '')? null : +test_expired.number.value,
        opened : (document.getElementById('test_status').value == 'free')? true : false,
        tradable : (document.getElementById('test_tradable').value == 'tradable')? true : false,
        availability : (document.getElementById('test_status').value == 'free')? true : false,
        questions : []
    }
    questions = document.getElementsByClassName('question')
    Array.from(questions).forEach(function(record, index) {
        qs = get_question(record, index+1)
        if (qs == undefined)
            return undefined
        test.questions.push(qs);
    });
    return test
}

$(function() {
    $(document).on('click touchstart', '.addAnswer', function(event){
        html = ""
        html += '<div class="answer form-group row mb-2">'
            html += '<label for="example-text-input" class="col-3 col-form-label">Варианты ответа:</label>'
            html += '<div class="col-1 pr-0"><input class="answer_rights mt-2" type="checkbox"></div>'
            html += '<div class="col-7 pl-0"><input class="answer_text d-inline-block form-control" type="text" value="" placeholder="Введите ответ"></div>'
            html += '<div class="col-1 pl-0"><input class="remove_answer d-inline-block form-control" type="button" value="X" placeholder="X"></div>'
        html += '</div>'
        el = event.target.parentNode.parentNode.previousSibling
        $(el).append(html)
//        event.target.parentNode.parentNode.previousSibling.innerHTML += "<div class=\"answer form-group row mb-2\">  <label for=\"example-text-input\" class=\"col-3 col-form-label\"></label><div class=\"col-1 pr-0\"><input class=\"answer_rights mt-2\" type=\"checkbox\"></div><div class=\"col-8 pl-0\"><input class=\"answer_text d-inline-block form-control\"  type=\"text\" value=\"\" placeholder=\"Введите ответ\">  </div></div>"
    });
    $(document).on('click touchstart', '#addQuestion', function(){
        add_question(2)
    });

    $(document).on('click touchstart', '.remove_answer', function(event){
        event.target.parentNode.parentNode.remove()
    });

    $(document).on('click touchstart', '.remove_question', function(event) {
        event.target.parentNode.parentNode.parentNode.remove()
    });

    $(document).on('click touchstart', '.begin_test_solution', function(event) {
        event.preventDefault()
        test_id = event.target.attributes.href.value
        begin_solution_test(test_id)
    });

    $(document).on('click touchstart', '.search_record_block', function(event) {
        event.preventDefault()
        console.log(event.target)
        post_id = event.target.parentNode.parentNode.dataset.post
        console.log(post_id)
        change_content('post', post_id)
    });

    $(document).on('click touchstart', '#button_to_main_page', function(event) {
        change_content('main');
    });

    $(document).on('click touchstart', '#block_test_important', function(event) {
        check_test_important_fields()
    });
    $(document).on('click touchstart', '#test_audience', function(event) {
        check_test_isClosed_fields()
    });

    $(document).on('click touchstart', '.post_get_title', function(event) {
        event.preventDefault()
        $.fancybox.close();
        change_content('post', event.target.attributes.href.value)
    });

    $(document).on('click touchstart', '.footer_post_link', function(event) {
        event.preventDefault()
        post_id = event.target.attributes.href.value
        change_content('post', post_id)
    });

    $(document).on('click touchstart', '.footer_test_link', function(event) {
        event.preventDefault()
        test_id = event.target.attributes.href.value
        change_content('test', test_id)
    });

});
function add_question(q_answers,
index){
    index = 0;
    question_html = ''
    question_html += '<div class="question queCard mt-5">'
        question_html += '<div class="form-group row">'
            question_html += '<label for="example-text-input" class="col-3 col-form-label">Вопрос</label>'
            question_html += '<div class="col-9">'
                question_html += '<input class="question_text form-control" type="text" value="" placeholder="Введите вопрос" id="questionName1">'
            question_html += '</div>'
        question_html += '</div>'
        question_html += '<div class="form-group row">'
            question_html += '<label for="example-text-input" class="col-3 col-form-label">Прикрепить медиа:</label>'
            question_html += '<div class="col-9">'
                question_html += '<input class="question_media_url form-control" type="text" value="" placeholder="Вставьте ссылку на фото или видео" id="example-text-input1">'
            question_html += '</div>'
        question_html += '</div>'
        question_html += '<div class="form-group row mb-2">'
            question_html += '<label for="example-text-input" class="col-3 col-form-label"></label>'
            question_html += '<div class="col-9">Правильный(-е) варианты ответа отметьте галочкой</div>'
        question_html += '</div>'
        question_html += '<div class="answers" >'
            while (index < q_answers){
                question_html += '<div class="answer form-group row mb-2">'
                    question_html += '<label for="example-text-input" class="col-3 col-form-label">Варианты ответа:</label>'
                    question_html += '<div class="col-1 pr-0"><input class="answer_rights mt-2" type="checkbox"></div>'
                    question_html += '<div class="col-7 pl-0"><input class="answer_text d-inline-block form-control" type="text" value="" placeholder="Введите ответ"></div>'
                    question_html += '<div class="col-1 pl-0"><input class="remove_answer d-inline-block form-control" type="button" value="X" placeholder="X"></div>'
                question_html += '</div>'
                index++;
            }
        question_html += '</div>'
        question_html += '<div class="form-group row mb-2">'
            question_html += '<label for="example-text-input" class="col-3 col-form-label"></label>'
            question_html += '<div class="col-9">'
                question_html += '<button type="button" class="btn btn-outline-warning addAnswer">Добавить вариант</button>'
                question_html += '<button type="button" class="btn btn-outline-danger remove_question" style="float:right;">Удалить вопрос</button>'
            question_html += '</div>'
        question_html += '</div>'
    question_html += '</div>'
    $(".questions").append(question_html);
    return document.getElementsByClassName('questions')[0].lastChild
}

ajax_urls = {
    create_category_of_post : {
        url : "/content/category",
        method : "GET",
        data : {}
    },
    create_post : {
        url : "/content/make/post",
        method : "GET",
        data : {}
    },
    create_test : {
        url : "/content/create_test",
        method : "GET",
        data : {}
    },
    list_of_categories : {
        url : "/content/categories",
        method : "GET",
        data : {}
    },
    list_of_tests : {
        url : "/content/tests",
        method : "GET",
        data : {}
    },
    list_of_users : {
        url : "/content/users",
        method : "GET",
        data : {}
    },
    main : {
        url : "/content/main",
        method : "GET",
        data : {}
    },
    list_of_organizations : {
        url : "/content/organizations",
        method : "GET",
        data : {}
    },
    registration : {
        url : "/content/registration",
        method : "GET",
        data : {}
    },
    test : {
        url : "/content/test",
        method : "GET",
        data : {}
    },
    tests_of_user : {
        url : "/content/user/tests",
        method : "GET",
        data : {}
    },
    results_of_tests : {
        url : "/content/user/tests",
        method : "GET",
        data : {}
    },
    test_conclusion : {
        url : "/content/test_conclusion",
        method : "GET",
        data : {}
    },
    post : {
        url : "/content/post",
        method : "POST",
        data : {
            post_id : undefined
        }
    },
    edit_post : {
        url : "/content/make/post",
        method : "GET",
        data : {}
    },
    edit_test : {
        url : "/content/create_test",
        method : "GET",
        data : {}
    },
    images_operations : {
        url : "/content/images_operations",
        method : "GET",
        data : {}
    },
    list_of_catalog_tests : {
        url : "/content/list_of_catalog_tests",
        method : "GET",
        data : {}
    },
    list_of_catalog_posts : {
        url : "/content/list_of_catalog_posts",
        method : "GET",
        data : {}
    },
    appoint_test : {
        url : '/content/create_test',
        method : "GET",
        data : {}
    },
    slider_control : {
        url : '/content/slider',
        method : "GET",
        data : {}
    },
    search_list : {
        url : '/content/search_list/',
        method : "GET",
        data : {}
    },
    edit_user : {
        url : '/content/edit_user',
        method : 'GET',
        data : {}
    },
    archive_of_users : {
        url : '/content/archive_of_users',
        method : 'GET',
        data : {}
    },
    archive_of_organizations : {
        url : '/content/archive/organizations',
        method : 'GET',
        data : {}
    },
    feedback_page : {
        url : '/content/feedback',
        method : 'GET',
        data : {}
    }
}

function change_content(name, params) {
    return new Promise(function(resolve, reject){
        if (timeout_test_timer)
            clearTimeout(timeout_test_timer)
        if (ajax_urls[name] != undefined) {
            axios({
                url : function() {
                    if (name == 'test_conclusion')
                        return ajax_urls[name].url + '/' + params // params is test solution id
                    else if (name == 'list_of_tests' && params != undefined)
                        return ajax_urls[name].url + '/category/' + params // show tests by category id (params is category_id)
                    else if (name == 'search_list')
                        return ajax_urls[name].url + params // add to request string of search input
                    else if (name == 'edit_user')
                        return ajax_urls[name].url + '/' + params // add to request user_id for edit
                    else
                     return ajax_urls[name].url
                }(),
                method : ajax_urls[name].method,
                withCredentials : true,
                data : function() {
                    if (name == 'post') ajax_urls[name].data.post_id = params
                    return ajax_urls[name].data
                }()
            }).then(function(res) {
                function tangle_test_expired() {
                    test_expired = {
                        activate : document.getElementById('test_expired_activate'),
                        range : document.getElementById('test_expired_range'),
                        number : document.getElementById('test_expired_number')
                    }
                    test_expired.activate.addEventListener('change', function() {
                        if (test_expired.activate.checked) {
                            test_expired.range.disabled = false
                            test_expired.number.disabled = false
                            test_expired.range.value = 1
                            test_expired.number.value = "1"
                        } else {
                            test_expired.range.disabled = true
                            test_expired.number.disabled = true
                            test_expired.range.value = 0
                            test_expired.number.value = ""
                        }
                    });
                    test_expired.range.addEventListener('change', function() {
                        test_expired.number.value = test_expired.range.value
                    });
                    test_expired.number.addEventListener('change', function() {
                        test_expired.range.value = test_expired.number.value
                    });
                }
                if (res.data.status == 'not_auth')
                    location.reload()
                main.innerHTML = res.data
                if (name == 'main') { main_load() }
                if (name == 'registration') { registration_load() }
                if (name == 'list_of_tests') {
                    if (params == undefined) {
                        list_of_tests_load()
                    } else {
                        list_of_tests_load(params) // params here is category_id
                    }
                }
                if (name == 'list_of_users') { list_of_users_load() }
                if (name == 'list_of_organizations') { list_of_organizations_load() }
                if (name == 'list_of_categories') { list_of_categories_load() }
                if (name == 'create_post') {
                    page_of_create_post_load(params)
                }
                if (name == 'post') { page_of_post_load(params) }
                if (name == 'create_test') {
                    if (params == undefined) {
                        create_test_load()
                    } else {
                        create_test_load(params) // params here is category_id
                    }
                    tangle_test_expired()
                }
                if (name == 'edit_post') { edit_post_load(params) }
                if (name == 'edit_test') {
                    edit_test_load(params)
                    tangle_test_expired()
                }
                if (name == 'results_of_tests') { results_of_tests(params) }
                if (name == 'images_operations') { images_operations_load() }
                if (name == 'list_of_catalog_tests') { list_of_catalog_tests_load() }
                if (name == 'list_of_catalog_posts') { list_of_catalog_posts_load() }
                if (name == 'appoint_test') {
                    appoint_test_load(params)
                    tangle_test_expired()
                }
                if (name == 'test_conclusion') { test_conclusion_load(params) }
                if (name == 'slider_control') { slider_control_load() }
                if (name == 'search_list') { search_list_load() }
                if (name == 'edit_user') { edit_user_load(params) }
                if (name == 'archive_of_users') { archive_of_users_load()  }
                if (name == 'archive_of_organizations') { archive_of_organizations_load()  }
                if (name == 'feedback_page') { feedback_page_load() }
                resolve();
            });
        }
    });
}

function page_of_post_load(post_id) {
    post_url = document.getElementById('post_url')
    post_url_copy = document.getElementById('post_url_copy')
    post_url.value = 'http://' + location.host + '/post/' + post_id
    post_url_copy.addEventListener('click', function() {
        console.log(post_url.value)
        post_url.select()
        document.execCommand("copy")
    });
}
function simple_tests_render_navigation(){
    tests = []
    axios({
        url : '/api/list/tests/not_important',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        data = res.data.data
        element = document.getElementById('collapseTwo')
        html = ""
        index = 0
        for (category in data) {
            console.log(category)
            html += '<div class="accordion-heading">'
                html += '<a class="accordion-toggle item button" data-toggle="collapse" data-parent="#accordion2" href="#collapseInner_yi' + index + '">' + category + '</a>'
            html += '</div>'
            html += '<div id="collapseInner_yi' + index + '" class="accordion-body collapse in">'
                html += '<div class="accordion-inner">'
                    data[category].forEach(function(test) {
                        html += '<a href="' + test.id + '" class="accordion-link begin_test_solution" id="simple_test_' + test.id + '">' + test.title + '</a>'
                    });
                html += '</div>'
            html += '</div>'
            index += 1
        }
        element.innerHTML = html
    });
}
function control_tests_render_navigation(){
    tests = []
    axios({
        url : '/api/list/tests/important',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        data = res.data.data
        element = document.getElementById('collapseThree')
        html = ""
        index = 0
        for (category in data) {
            console.log(category)
            html += '<div class="accordion-heading">'
                html += '<a class="accordion-toggle item button" data-toggle="collapse" data-parent="#accordion2" href="#collapseInner_zi' + index + '">' + category + '</a>'
            html += '</div>'
            html += '<div id="collapseInner_zi' + index + '" class="accordion-body collapse in">'
                html += '<div class="accordion-inner">'
                    data[category].forEach(function(test) {
                        html += '<a href="' + test.id + '" class="accordion-link begin_test_solution" id="control_test_' + test.id + '">' + test.title + '</a>'
                    });
                html += '</div>'
            html += '</div>'
            index += 1
        }
        element.innerHTML = html
    });

}

simple_tests_block.addEventListener('click', function() {
    simple_tests_render_navigation()
})
if (control_tests_block)
    control_tests_block.addEventListener('click', function() {
        control_tests_render_navigation()
    })

function main_load() {
    $('.slider').slick({
        dots: true,
        infinite: true,
        arrows: true,
    });
}

function registration_load() {
    reg_input_organization = document.getElementById('reg_input_organization');
    reg_select_organization = document.getElementById('reg_select_organization');
    reg_new_org = document.getElementById('reg_new_org');
    reg_like_admin = document.getElementById('reg_like_admin');

    reg_messages = document.getElementById('reg_messages')
    reg_first_name = document.getElementById('reg_first_name')
    reg_second_name = document.getElementById('reg_second_name')
    reg_email = document.getElementById('reg_email')
    reg_phone_number = document.getElementById('reg_phone_number')
    reg_password = document.getElementById('reg_password')
    reg_confirm_password = document.getElementById('reg_confirm_password')
    reg_submit = document.getElementById('reg_submit')

    function build_organization_list() {
        axios({
            url : '/api/organizations',
            method : 'GET',
            withCredentials : true
        }).then(function(res) {
            data = res.data
            if (data.status == 'success') {
                data = data.data
                if (reg_new_org) {
                    reg_select_organization.innerHTML = '<option selected disabled value="default">Выбрать организацию</option>'
                    data.forEach(function(element) {
                        reg_select_organization.innerHTML += '<option selected value="' + element.name + '">' + element.name + '</option>'
                    });
                } else {

                }
            }
        });
    }

    function get_organization_name() {
        organization_name  = undefined
        if (reg_new_org)
            if (!reg_new_org.checked) {
                organization_name = reg_select_organization.value
            } else {
                organization_name = reg_input_organization.value
            }
        else
            organization_name = reg_select_organization.value
        return organization_name
    }

    build_organization_list()
    if (reg_new_org)
        reg_new_org.addEventListener('click', function() {
            if (reg_new_org.checked) {
                reg_select_organization.hidden = true
                reg_input_organization.hidden = false
            } else {
                reg_select_organization.hidden = false
                reg_input_organization.hidden = true
                build_organization_list()
            }
        });


    reg_submit.addEventListener('click', function(e) {
        e.preventDefault()
        axios({
            url : '/api/registrate',
            method : 'PUT',
            withCredentials : true,
            data : {
                first_name : reg_first_name.value,
                second_name : reg_second_name.value,
                phone_number : reg_phone_number.value,
                creating_flag : (reg_new_org)? reg_new_org.checked : false,
                admin_flag : (reg_like_admin)? reg_like_admin.checked : false,
                organization_name : get_organization_name(),
                email : reg_email.value,
                password : reg_password.value,
                confirm_password : reg_confirm_password.value
            }
        }).then(function(res) {
            if( res.data.status == 'error') {
                data = res.data
                reg_messages.innerHTML = ""
                data['messages'].forEach(function(element) {
                    reg_messages.innerHTML += '<li class="denied">' + element + "</li>"
                });
            } else {
                change_content('main')
            }
        });
    });
}

_global_test_id = null
appoint_users_to_test_table = undefined
function begin_appoint_user_test(test_id) {
    _global_test_id = test_id
    axios({
        url : '/api/test/' + test_id + '/users',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        data = res.data.data
        response = []
        data.forEach(function(user, index){
            response.push({
                "id" : user.id,
                "user_id" : user.user_id,
                "username" : user.first_name + " " + user.second_name,
                "score" : (user.score == null || user.score == undefined)? 'Не пройден' : (user.score).toFixed(2),
                "attempts" : user.attempts,
                "availability" : user.availability
            });
        });
        appoint_users_to_test_table = new Tabulator('#appoint_users_to_test_table', {
            data: response,
            layout: 'fitColumns',
            movableColumns:false,
            resizableRows:false,
            index : "id",
            initialSort:[             //set the initial sort order of the data
                {column:"username", dir:"asc"},
            ],
            columns: [
                { title:"№", align:"center", formatter : "rownum", width:43, sorter:false, editor:false},
                { title: "Ф.И.О.", field: 'username', align:"username", width: 350},
                { title: "Пройден/Оценка", field: 'score', align:"center", width: 200},
                { title: "Попыток", field: 'attempts', align:"center", width: 200},
                { title : "Доступ", align:"center", formatter: function formatters_buttons_cell(cell, formatterParams) {
                    if (cell.getData().availability)
                        return '<input class="access_checkbox" type="checkbox" checked>'
                    else
                        return '<input class="access_checkbox" type="checkbox">'
                }, width: 110}
            ]
        });
        appoint_users_to_test_table.setData(response)
    });
}

function begin_edit_test(test_id) {
    change_content('edit_test', test_id)
}

function begin_delete_test(test_id) {
    axios({
        url : '/api/test/' + test_id,
        method : 'DELETE',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'success'){
            test_row = tests_table.getRow(test_id)
            tests_table.deleteRow(test_id)
        }
    });
}

tests_table = undefined
function list_of_tests_load(category_id){
    tests_organization_filtration = document.getElementById('organization_of_tests_filter')
    tests_organization_filtration.innerHTML = '<option value="Все организации">Все организации</option>'
    tests_organization_filtration.innerHTML += '<option value="Для всех организаций">Для всех организаций</option>'
    axios({
        url : '/api/category/organizations',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        data = res.data.data
        data.forEach(function(org) {
            tests_organization_filtration.innerHTML += '<option value="' + org.name + '">' + org.name + '</option>'
        });
    });
    tests_organization_filtration.addEventListener('change', function (event) {
        organization_name = tests_organization_filtration.value
        if (organization_name == 'Все организации')
            tests_table.clearFilter();
        else if (organization_name == 'Для всех организаций')
            tests_table.setFilter('organization', '=', 'Для всех организаций')
        else
            tests_table.setFilter([{ field : 'closed', type : '!=', value : false},{ field : 'organization', type : '=', value : organization_name}])
    });
    create_test_button = document.getElementById('create_test_button')
    create_test_button.addEventListener('click', function(e) {
        e.preventDefault()
        change_content('create_test', category_id)
    })
    axios({
        url : (category_id == undefined)? '/api/tests/all' : '/api/tests/category/' + category_id,
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'success'){
            tests_table = new Tabulator('#tests-table', {
            data: res.data.data,
            layout: 'fitColumns',
            movableColumns:false,
	        resizableRows:false,
	        index : "id",
            initialSort:[             //set the initial sort order of the data
		        {column:"title", dir:"asc"},
	        ],
            columns: [
                { title: 'Название теста', field: 'title', width: 140},
                { title: 'Контрольный', field: 'isImportant', width: 130, align:'center',  formatter : function(cell, formatterParams) {
                    if (cell._cell.value)
                        return "+"
                    else
                        return "-"
                }},
                { title: 'Вопросов', field: 'questions_count'},
//                { title: 'Попыток', field: 'attemptions'},
                { title: 'Ср. балл', field: 'average_score', formatter : function(cell) {
                    return (cell._cell.value).toFixed(2)
                }},
                { title: 'Действия', formatter: function formatters_buttons_cell(cell, formatterParams) {
                    function make_ref(text, href, type) {
                        if (type == 1) { // appoint
                            id = 'appoint_' + cell.getData().id
                            args =  '"' + cell.getData().id + '"'
                            onclick_text = 'begin_appoint_user_test(' + args + ')'
                        } else if (type == 2) { // edit
                            id = 'edit_' + cell.getData().id
                            onclick_text = 'begin_edit_test("' + cell.getData().id + '")'
                        } else if (type == 3) { // delete
                            id = 'delete_' + cell.getData().id
                            onclick_text = 'begin_delete_test("' + cell.getData().id + '")'
                        }
                        return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                    }
                    appoint_user = 'Привязать пользователя'
                    delete_test = 'Удалить'
                    edit_test = 'Редактировать'
                    appoint_user = make_ref(appoint_user, '#openTest1', 1)
                    edit_test = make_ref(edit_test, '#', 2)
                    delete_test = make_ref(delete_test, '#', 3)
                    $(function(){
                        $("#appoint_" + cell.getData().id).fancybox();
                    });
                    row = cell.getRow()
                    str = ''
                    if (row.getData().editable == true)
                        str = edit_test + '<br>' + delete_test
                    if (row.getData().isImportant == true)
                        return appoint_user + '<br>' + str
                    else
                        return str
                }, width: 228}
            ]
            });
        }
    });
    save_appoint_button = document.getElementById('save_appoint_test')
    save_appoint_button.addEventListener('click', function() {
        rows = appoint_users_to_test_table.getRows()
        request = []
        rows.forEach(function(row) {
            checkbox = row._row.cells[4].element.getElementsByClassName('access_checkbox')[0]
            request.push({
                appointed_id : row._row.data.id,
                availability : checkbox.checked
            });
        });
        axios({
            url : '/api/test/' + _global_test_id + '/users',
            method : 'POST',
            withCredentials : true,
            data : request
        }).then(function(res) {
            data = res.data
            if (res.data.status == 'not_auth')
                location.reload()
            if (data.status == 'success') {
                $.fancybox.close();
            }
        });
    });
}

table_test_answers = undefined
function begin_show_result(test_solution_id) {
    axios({
        url : '/api/test/' + test_solution_id + '/result',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        data = res.data.data
        mtn = document.getElementById('modal_test_name')
        mtn.innerHTML = data[0].test_name
        table_test_answers = new Tabulator('#table_test_answers', {
            data: data,
            layout: 'fitColumns',
            movableColumns:false,
            resizableRows:false,
            initialSort:[             //set the initial sort order of the data
                {column:"test_name", dir:"asc"},
            ],
            columns: [
                { title:"№", align:"center", formatter : "rownum", width:50, sorter:false, editor:false},
                { title: 'Текст вопроса', field: 'text', align:"center"},
                { title: 'Ответ', field: 'user_answer', align:"center"},
                { title: 'Правильные ответы', field: 'right_answers', align:"center"}
            ]
        });
        table_test_answers.setData(data)
    });
}

let table_results_of_tests = undefined
function results_of_tests(user_id) {
    back_button = document.getElementById('back_button')
    if (back_button)
        back_button.addEventListener('click', function(event){
            change_content('list_of_users')
        });
    axios({
        url : '/api/user/' + user_id + '/tests',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        data = res.data.data
        table_results_of_tests = new Tabulator('#table_results_of_tests', {
            data: data,
            layout: 'fitColumns',
            movableColumns:false,
            resizableRows:false,
            index : "id",
            initialSort:[             //set the initial sort order of the data
                {column:"test_name", dir:"asc"},
            ],
            columns: [
                { title:"№", align:"center", formatter : "rownum", width:50, sorter:false, editor:false},
                { title: 'Название теста', field: 'test_name', align:"center"},
                { title: 'Результат теста', field : 'txt', align:"center", formatter : function formatters_count_results(cell, formatterParams) {
                    row = cell.getRow()
                    all = row.getData().all_answers
                    rights_answers = row.getData().rights_answers
                    return rights_answers + '/' + all
                }},
                { title: 'Дата прохождения', field: 'created', align:"center", width: 215, formatter : function(cell) {
                    return '' + (new Date(cell._cell.value).toLocaleString('ru', {
                                                                            year: 'numeric',
                                                                            month: 'long',
                                                                            day: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute : 'numeric'
                                                                           }))
                }},
                { title : 'Действия', align:"center", formatter: function formatters_buttons_cell(cell, formatterParams) {
                    function make_ref(text, href, type) {
                        if (type == 1) { // edit
                            id = 'show_result_' + cell.getData().id
                            args =  '"' + cell.getData().id + '"'
                            onclick_text = 'begin_show_result(' + args + ')'
                        }
                        return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                    }
                    show_result = 'Детали'
                    show_result = make_ref(show_result, '#modal_test_answers', 1)
                    $(function(){ $("#show_result_" + cell.getData().id).fancybox(); });
                    return show_result
                }, width: 143}
            ]
        });
        table_results_of_tests.setData(res.data.data)
    });
}

let users_table = undefined

function begin_details_of_user(user_id) {
    change_content('results_of_tests', user_id)
}

function begin_edit_of_user(user_id) {
    change_content('edit_user', user_id)
}

function begin_delete_of_user(user_id) {
    axios({
        url : '/api/user/' + user_id + '/archived',
        method : 'POST',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        data = res.data
        if (data.status == 'success') {
            users_table.deleteRow(user_id)
        }
    });
}

function list_of_users_load(org_name=undefined) {
    console.log(org_name)
    axios({
        url : '/api/users',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        data = res.data.data
        response = []
        data.forEach(function(element){
            response.push({
                id : element.id,
                organization : element.organization_name,
                username : element.first_name + " " + element.second_name,
                tests_count : element.tests_count,
                average_score : (element.average_score).toFixed(2)
            });
        });
        users_table = new Tabulator('#list_of_users_table', {
            data : response,
            layout : 'fitColumns',
            movableColumns : false,
            resizableRows : false,
            index : 'id',
            initialSort: [             //set the initial sort order of the data
                {column:"username", dir:"asc"},
            ],
            columns : [
                { title: 'ФИО', field: 'username'},
                { title: 'Количество тестов', field: 'tests_count', align: 'center' },
                { title: 'Средний балл', field: 'average_score', align: 'center'},
                { title: 'Организация', field: 'organization', align: 'center' },
                { title : 'Действия', formatter: function formatters_buttons_cell(cell, formatterParams) {
                    function make_ref(text, href, type) {
                        if (type == 1){
                            id = 'details_' + cell.getData().id
                            onclick_text = 'begin_details_of_user("' + cell.getData().id + '")'
                            return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                        } else if (type == 2) {
                            id = 'delete_user_' + cell.getData().id
                            onclick_text = 'begin_delete_of_user("' + cell.getData().id + '")'
                            return '<a style="color:red;" id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                        } else if (type == 3) {
                            id = 'edit_user_' + cell.getData().id
                            onclick_text = 'begin_edit_of_user("' + cell.getData().id + '")'
                            return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                        }
                    }
                    details = 'Подробнее'
                    edit_user = 'Редактировать'
                    delete_user = 'Архивировать'
                    details = make_ref(details, '#', 1)
                    delete_user = make_ref(delete_user, '#', 2)
                    edit_user = make_ref(edit_user, '#', 3)
                    return details + '<br>' + edit_user + '<br>' + delete_user
                    }
                , width: 228}
            ]
        });
        if (!org_name){
            users_organization_filtration = document.getElementById('organization_of_user_filter')
            users_organization_filtration.innerHTML = '<option value="Все организации">Все организации</option>'
            axios({
                url : '/api/category/organizations',
                method : 'GET',
                withCredentials : true
            }).then(function(res) {
                if (res.data.status == 'not_auth')
                    location.reload()
                data = res.data.data
                data.forEach(function(org) {
                    users_organization_filtration.innerHTML += '<option value="' + org.name + '">' + org.name + '</option>'
                });
            });
            users_organization_filtration.addEventListener('change', function (event) {
                organization_name = users_organization_filtration.value
                if (organization_name == 'Все организации')
                    users_table.clearFilter();
                else
                    users_table.setFilter([{ field : 'organization', type : '=', value : organization_name}])
            });
        } else {
            users_table.setFilter([{ field : 'organization', type : '=', value : org_name}])
        }
    });

}

function begin_archive_organization(org_id) {
    axios({
        url : "/api/organization/" + org_id + "/archive",
        method : "POST",
        withCredentials : true
    }).then(function(res) {
        status = res.data.status
        if (status == 'success') {
            organizations_table.deleteRow(org_id)
        }
    });
}

function list_of_organizations_load() {
    axios({
        url : '/api/organizations',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
       organizations_table = new Tabulator('#organization-table', {
            data: res.data.data,
            layout: 'fitColumns',
            movableColumns:false,
            resizableRows:false,
            index : "id",
            initialSort:[             //set the initial sort order of the data
                {column:"count", dir:"asc"},
            ],
            columns: [
                { title: 'Название организации', field: 'name' },
                { title: 'Кол-во сотрудников', field: 'count' },
                { title: 'Средний балл', field: 'average_score', align: 'left', formatter : function(cell) {
                    return (cell._cell.value).toFixed(2)
                }},
                { title : 'Действия', formatter: function formatters_buttons_cell(cell, formatterParams) {
                    function make_ref(text, href, type) {
                        if (type == 1){
                            id = 'edit_organization_' + cell.getData().id
                            onclick_text = 'begin_edit_organization(\'' + cell.getData().id + '\', false)'
                            return '<a id="' + id + '" href="' + href + '" onclick="' + onclick_text + '">' + text + '</a>'
                        } else if (type == 2) {
                            id = 'archive_organization_' + cell.getData().id
                            onclick_text = 'begin_archive_organization("' + cell.getData().id + '")'
                            return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                        }
                    }
                    edit_org = 'Редактировать'
                    archive_org = 'Архивировать'
                    edit_org = make_ref(edit_org, '#edit_org_block', 1)
                    archive_org = make_ref(archive_org, '#', 2)
                    $(function(){
                        $("#edit_organization_" + cell.getData().id).fancybox();
                    });
                    return edit_org + '<br>' + archive_org
                }
                , width: 228}
            ]
        });
    });
}

category_table = undefined
posts_table = undefined

function edit_post_load(post_id) {
    post_id = Number(post_id)
    article_header = document.getElementById('article_header')
    article_header.innerHTML = 'Редактирование статьи'
    axios({
        url : '/api/post/' + post_id,
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        $.fancybox.close();
        data = res.data.data
        title = document.getElementById('articleNameToSave')
        category = document.getElementById('articleCategory')
        article_text = document.getElementById('articleText')
        save_button = document.getElementById('saveArticle')
        audience_field = document.getElementById('article_audience')
        status_field = document.getElementById('article_status')
        block_article_status = document.getElementById('block_article_status')

        if (data.isSuperAdmin){
                axios({
                    url : '/api//category/organizations',
                    method : 'GET',
                    withCredentials : true
                }).then(function(res) {
                    if (res.data.status == 'success'){
                        organizations = res.data.data
                        organizations.forEach(function(org) {
                            audience_field.innerHTML += '<option value="' + org.id + '">' + org.name + '</option>'
                        });
                        audience_field.value = (data.closed)? ((data.isSuperAdmin)? data.organization_id : 'closed') : 'notClosed'
                        status_field.value = (data.tradable)? 'tradable' : 'notTradable'
                    }
                });
        }

        if (data.category_closed) {
            audience_field.disabled = true
        } else {
            audience_field.disabled = false
        }

        audience_field.addEventListener('change', function(event) {
            target = event.target
            if (target.value == 'notClosed') {
                status_field.value = 'notTradable'
                block_article_status.hidden = true
            } else {
                status_field.value = 'notTradable'
                block_article_status.hidden = false
            }
        });

        title.value = data.title
        category.value = data.category
        article_text.value = data.text
        audience_field.value = (data.closed)? ((data.isSuperAdmin)? data.organization_id : 'closed') : 'notClosed'
        status_field.value = (data.tradable)? 'tradable' : 'notTradable'

        if (audience_field.value == 'notClosed') {
            status_field.value = 'notTradable'
            block_article_status.hidden = true
        } else {
            status_field.value = 'notTradable'
            block_article_status.hidden = false
        }


        render_cleditor()
        save_button.addEventListener('click', function() {
            axios({
                url : '/api/post/' + post_id,
                method : 'POST',
                withCredentials : true,
                data : {
                    title : title.value,
                    text : article_text.value,
                    audience : (audience_field.value == 'closed' || audience_field.value == 'notClosed')? null : audience_field.value,
                    closed : (audience_field.value != 'notClosed')? true : false,
                    tradable : (status_field.value == 'tradable')? true : false
                }
            }).then(function(res) {
                if (res.data.status == 'not_auth')
                    location.reload()
                status = res.data.status
                if (status == 'success')
                    change_content('list_of_categories')
                else
                    console.log('Что-то пошло не так.')
            });
        });
    });
}

function begin_edit_post(post_id) {
    post_id = Number(post_id)
    change_content('edit_post', post_id)
}

function begin_delete_post(post_id) {
    post_id = Number(post_id)
    axios({
        url : '/api/post/' + post_id,
        method : 'DELETE',
        withCredentials : true
    }).then(function(res){
        if (res.data.status == 'not_auth')
            location.reload()
        row_for_delete = posts_table.getRow(post_id)
        category_table.deleteRow(row_for_delete)
    });
}

save_button_listener = undefined

function begin_edit_category(category_id) {
    category_id = Number(category_id)
    category_field = document.getElementById('categoryNameToSave')
    organization_field = document.getElementById('categoryAudience')
    section_field = document.getElementById('categorySection')
    modal_category_name = document.getElementById('modal_category_name')
    new_category_tabulator = document.getElementById('newCategory-table')
    new_category_tabulator.hidden = false
    modal_category_name.innerHTML = "Управление категорией"
    category_name = category_table.getRow(category_id).getData().name
    organization_name = category_table.getRow(category_id).getData().organization
    category_field.value = category_name
    old_category_name = category_table.getRow(category_id).getData().name
    old_organization_name = category_table.getRow(category_id).getData().organization
    id = category_table.getRow(category_id).getData().id
    count = category_table.getRow(category_id).getData().count
    editable = category_table.getRow(category_id).getData().editable
    section = category_table.getRow(category_id).getData().section
    if (section == 1)
        section_field.value = 'study'
    else if (section == 2)
        section_field.value = 'news'
    else
        section_field.value = 'study'
    axios({
        url : '/api/category/organizations',
        method : 'GET',
        withCredentials : true
        }).then(function(res) {
            if (res.data.status == 'not_auth')
                location.reload()
            data = res.data
            if (data.status == 'success'){
                response_organizations = data.data
                organization_field.innerHTML = ""
                organization_field.innerHTML = '<option>Для всех организаций</option>'
                response_organizations.forEach(function(response_organization) {
                    organization_field.innerHTML += '<option>' + response_organization.name + '</option>'
                });
                organization_field.value = organization_name
                save_button = document.getElementById('saveCategory')
                if (!editable){
                    category_field.disabled = true
                    organization_field.disabled = true
                } else {
                    category_field.disabled = false
                    organization_field.disabled = false
                }
                console.log(category_id)
                axios({
                    url : '/api/category/' + category_id + '/posts',
                    method : 'GET',
                    withCredentials : true
                }).then(function(res) {
                    if (res.data.status == 'not_auth')
                        location.reload()
                    posts_table = new Tabulator('#newCategory-table', {
                        data: res.data.data,
                        layout: 'fitColumns',
                        movableColumns:false,
                        resizableRows:false,
                        index : "id",
                        initialSort:[             //set the initial sort order of the data
                            {column:"title", dir:"asc"},
                        ],
                        columns: [
                            { title:"№", align:"center", formatter : "rownum", width:50, sorter:false, editor:false},
                            { title: 'Название статьи', field: 'title', align:"center", formatter: function formatters_buttons_cell(cell, formatterParams) {
                                return '<a class="post_get_title" href="' + cell.getRow().getData().id + '">' + cell.getRow().getData().title + '</a>'
                            }},
                            { title: 'Организация', field: 'organization', align:"center"},
                            { title : 'Действия', align:"center", formatter: function formatters_buttons_cell(cell, formatterParams) {
                                function make_ref(text, href, type) {
                                    if (type == 1) { // edit
                                        id = 'edit_' + cell.getData().id
                                        args =  '"' + cell.getData().id + '"'
                                        onclick_text = 'begin_edit_post(' + args + ')'
                                    } else if (type == 2) { // delete
                                        id = 'delete_' + cell.getData().id
                                        onclick_text = 'begin_delete_post("' + cell.getData().id + '")'
                                    }
                                    return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                                }
                                edit_post = 'Редактировать'
                                delete_post = 'Удалить'
                                edit_post = make_ref(edit_post, '#', 1)
                                delete_post = make_ref(delete_post, '#', 2)
                                if (cell.getRow().getData().editable)
                                    if (cell.getRow().getData().isAdded)
                                        return delete_post
                                    else
                                        return edit_post + '<br>' + delete_post
                                return ""
                            }, width: 143}
                        ]
                    });
                });
                if (save_button)
                    save_button_listener = function save_button_listener() {
                        if (category_field.value == old_category_name
                            && old_organization_name == organization_field.value
                            && section == section_field.value) {
//                            save_button.removeEventListener('click', save_button_listener, false)
                            $.fancybox.close();
                        }
                        else if (category_field.value && organization_field.value)
                            axios({
                                url : '/api/category/' + category_id,
                                method : 'POST',
                                withCredentials : true,
                                data : {
                                    name : category_field.value,
                                    organization_name : (organization_field.value == 'Для всех организаций' || organization_field.value == '')? null : organization_field.value,
                                    section : section_field.value
                                }
                            }).then(function(res) {
                                if (res.data.status == 'not_auth')
                                    location.reload()
                                if (res.data.status == 'success') {
                                    category_name = category_field.value
                                    organization_name = organization_field.value
                                    section = (section_field.value == 'news')? 2 : 1
                                    $.fancybox.close();
//                                    category_table.deleteRow(id)
                                    category_table.updateData([{id : category_id, name : category_name,
                                                                count : count,
                                                                organization : organization_name,
                                                                section : section}]);
                                }
                                save_button.removeEventListener('click', save_button_listener, false)
                            });
                    }
                    save_button.addEventListener('click', save_button_listener);
            }
    });
}
function begin_delete_category(category_id) {
    category_id = Number(category_id)
    axios({
        url : '/api/category/' + category_id,
        method : 'DELETE',
        withCredentials : true
    }).then(function(res){
        if (res.data.status == 'not_auth')
            location.reload()
        if (res.data.status == 'success')
            category_table.deleteRow(category_id)
    });
}

function begin_show_tests(category_id) {
    change_content('list_of_tests', category_id)
}

function begin_add_post(category_id) {
    category_id = Number(category_id)
    change_content('create_post', category_table.getRow(category_id).getData().id);
}

function list_of_categories_load() {
    $(function(){
        $("#newCategory").fancybox({
           beforeClose : function(){
               save_button = document.getElementById('saveCategory')
               console.log('closed')
               if (save_button){
                    console.log('closed 2')
                    console.log(save_button)
                   console.log(save_button_listener)
                   save_button.removeEventListener('click', save_button_listener, false)
               }
           }
        });
    });
    organizations_filter = document.getElementById('organizations_filter')
    organizations_filter.innerHTML += '<option selected value="Все организации">Все организации</option>'
    organizations_filter.innerHTML += '<option value="Для всех организаций">Для всех организаций</option>'
    create_category_button = document.getElementById('create_category_button')
    axios({
        url : '/api/category/organizations',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        data = res.data.data
        data.forEach(function(org) {
            organizations_filter.innerHTML += '<option value="' + org.name + '">' + org.name + '</option>'
        });
    });
    category_organization_filtration = document.getElementById('organizations_filter')
    category_organization_filtration.addEventListener('change', function (event) {
        organization_name = category_organization_filtration.value
        if (organization_name == 'Все организации')
            category_table.clearFilter();
        else if (organization_name == 'Для всех организаций')
            category_table.setFilter('organization', '=', 'Для всех организаций')
        else
            category_table.setFilter([{ field : 'organization', type : '=', value : organization_name}])
    });
    if (create_category_button)
        create_category_button.addEventListener('click', function() {
            modal_category_name = document.getElementById('modal_category_name')
            modal_category_name.innerHTML = 'Создание категории'
            category_field = document.getElementById('categoryNameToSave')
            organization_field = document.getElementById('categoryAudience')
            section_field = document.getElementById('categorySection')
            new_category_tabulator = document.getElementById('newCategory-table')
            new_category_tabulator.hidden = true
            category_field.disabled = false
            organization_field.disabled = false
            axios({
                url : '/api/category/organizations',
                method : 'GET',
                withCredentials : true
            }).then(function(res) {
                if (res.data.status == 'not_auth')
                    location.reload()
                data = res.data
                if (data.status == 'success'){
                    response_organizations = data.data
                    category_name_field = document.getElementById('categoryNameToSave')
                    category_name_field.value = ""
                    organization_name_field = document.getElementById('categoryAudience')
                    organization_name_field.innerHTML = ""
                    organization_name_field.innerHTML = '<option>Для всех организаций</option>'
                    response_organizations.forEach(function(response_organization) {
                        organization_name_field.innerHTML += '<option>' + response_organization.name + '</option>'
                    });
                    save_button = document.getElementById('saveCategory')
                    if (save_button)
                        save_button_listener = function add_category_listener() {
                            if (category_name_field.value && organization_name_field.value)
                                axios({
                                    url : '/api/category/' + category_name_field.value,
                                    method : 'PUT',
                                    withCredentials : true,
                                    data : {
                                        section : section_field.value,
                                        organization_name : (organization_name_field.value == 'Для всех организаций')? null : organization_name_field.value
                                    }
                                }).then(function(res) {
                                    if (res.data.status == 'not_auth')
                                        location.reload()
                                    if (res.data.status == 'success') {
                                        id = res.data.data.id
                                        category_name = category_name_field.value
                                        organization_name = organization_name_field.value
                                        $.fancybox.close();
                                        section = (section_field.value == 'news')? 2 : 1
                                        category_table.addRow({id : id, name : category_name, organization : organization_name, editable : true, section : section, count_posts : 0, count_tests : 0}, true);
                                    }
                                });
                            save_button.removeEventListener('click', add_category_listener, false)
                        }
                        save_button.addEventListener('click', save_button_listener)
                }
            });
        });
    axios({
        url : '/api/categories',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
                location.reload()
        category_table = new Tabulator('#category-table', {
            data: res.data.data,
            layout: 'fitColumns',
            movableColumns:false,
	        resizableRows:false,
	        index : "id",
            initialSort:[             //set the initial sort order of the data
		        {column:"name", dir:"asc"},
	        ],
            columns: [
                { title: 'Название категории', field: 'name'},
                { title: 'Организация', field: 'organization', align:'center'},
                { title: 'Статей', align:'center', field: 'count_posts', width:107},
                { title: 'Тестов', align:'center', field: 'count_tests', width:107},
                { title: 'Раздел', field: 'section', align:"center", formatter: function formatters_buttons_cell(cell, formatterParams) {
                    if (cell._cell.value == 1)
                        return 'Обучение'
                    if (cell._cell.value == 2)
                        return 'Новости'
                    return 'Неизвестно'
                }},
                { title: 'Действия', formatter: function formatters_buttons_cell(cell, formatterParams) {
                    function make_ref(text, href, type) {
                        if (type == 1) { // edit
                            id = 'edit_' + cell.getData().id
                            args =  '"' + cell.getData().id + '"'
                            onclick_text = 'begin_edit_category(' + args + ')'
                        } else if (type == 2) { // delete
                            id = 'delete_' + cell.getData().id
                            onclick_text = 'begin_delete_category("' + cell.getData().id + '")'
                        } else if (type == 3) { // add post
                            id = 'add_post_' + cell.getData().id
                            onclick_text = 'begin_add_post("' + cell.getData().id + '")'
                        } else if (type == 4) { // show list of tests by category
                            id = 'show_tests_' + cell.getData().id
                            onclick_text = 'begin_show_tests("' + cell.getData().id + '")'
                        }
                        return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                    }
                    edit_category = 'Редактировать категорию'
                    delete_category = 'Удалить категорию'
                    show_tests = 'Список тестов'
                    add_post = 'Добавить статью'
                    edit_category = make_ref(edit_category, '#editCategory', 1)
                    delete_category = make_ref(delete_category, '#', 2)
                    show_tests = make_ref(show_tests, '#', 4)
                    add_post = make_ref(add_post, '#', 3)
                    $(function(){
                        $("#edit_" + cell.getData().id).fancybox({
                           afterClose : function(){
                               save_button = document.getElementById('saveCategory')
                               if (save_button)
                                   save_button.removeEventListener('click', save_button_listener, false)
                           }
                        });
                    });
                    editable = cell.getData().editable
                    console.log(editable)
                    if (editable)
                        return edit_category + '<br>' + delete_category + '<br>' + show_tests + '<br>' + add_post
                    else
                        return edit_category + '<br>' + show_tests + '<br>' + add_post
                }, width: 228}
            ]
        });
    });
}

function page_of_create_post_load(category_id) {
    axios({
        url : '/api/category/' + category_id,
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
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
        data = res.data.data
        category_name = data.name
        category_field = document.getElementById('articleCategory')
        category_field.value = category_name
        audience_field = document.getElementById('article_audience')
        status_field = document.getElementById('article_status')
        block_article_status = document.getElementById('block_article_status')
        if (data.isSuperAdmin){
            axios({
                url : '/api/category/organizations',
                method : 'GET',
                withCredentials : true
            }).then(function(res) {
                if (res.data.status == 'success'){
                    organizations = res.data.data
                    organizations.forEach(function(org) {
                        audience_field.innerHTML += '<option value="' + org.id + '">' + org.name + '</option>'
                    });
                    audience_field.value = data.organization_id
                }
            });
        }
        if (data.closed)
            audience_field.disabled = true
        else
            audience_field.disabled = false
        audience_field.addEventListener('change', function(event) {
            target = event.target
            if (target.value == 'notClosed') {
                status_field.value = 'notTradable'
                block_article_status.hidden = true
            } else {
                status_field.value = 'notTradable'
                block_article_status.hidden = false
            }
        });
        $("#saveArticle").on("click", function() {
            save_article_button = document.getElementById('saveArticle')
            save_article_button.style.visibility = 'hidden'
            article={
                 title: $("#articleNameToSave").val(),
                 category: $("#articleCategory").val(),
                 text: $("#articleText").val()
            }
            axios({
                url : '/api/category/' + category_id + '/post',
                method : 'PUT',
                withCredentials : true,
                data : {
                    title : article.title,
                    text : article.text,
                    closed : (audience_field.value == 'notClosed')? false : true,
                    organization_id : (audience_field.value == 'closed' || audience_field.value == 'notClosed')? null : audience_field.value,
                    tradable : (status_field.value == 'tradable')? true : false
                }
            }).then(function(res) {
                if (res.data.status == 'not_auth')
                    location.reload()
                if (res.data.status == 'success') {
                    change_content('list_of_categories')
                } else {
                    save_article_button.style.visibility = 'visible'
                }
            });
        });
    });
}

nav_main_button = document.getElementById('nav_main_button')
nav_study_button = document.getElementById('nav_study_button')

nav_categories_container = document.getElementById('nav_categories_container')
nav_users_button = document.getElementById('nav_users_button')
nav_archive_users_button = document.getElementById('nav_archive_users_button')
nav_organizations_button = document.getElementById('nav_organizations_button')
nav_archive_organizations_button = document.getElementById('nav_archive_organizations_button')
nav_tests_button = document.getElementById('nav_tests_button')
nav_study_categories_button = document.getElementById('nav_study_categories_button')
nav_images_button = document.getElementById('nav_images_button')
nav_catalog_tests_button = document.getElementById('nav_catalog_tests_button')
nav_catalog_posts_button = document.getElementById('nav_catalog_posts_button')
nav_slider_button = document.getElementById('nav_slider_button')
nav_feedback_page = document.getElementById('feedback_page')

nav_feedback_page.addEventListener('click', function() {
    change_content('feedback_page')
});

nav_main_button.addEventListener('click', function() {
    change_content('main')
});

if (nav_users_button)
    nav_users_button.addEventListener('click', function() {
        change_content('list_of_users');
    });

if (nav_archive_users_button)
    nav_archive_users_button.addEventListener('click', function() {
        change_content('archive_of_users');
    });


if (nav_organizations_button)
    nav_organizations_button.addEventListener('click', function() {
        change_content('list_of_organizations');
    });

if (nav_archive_organizations_button)
    nav_archive_organizations_button.addEventListener('click', function() {
        change_content('archive_of_organizations');
    });

if (nav_tests_button)
    nav_tests_button.addEventListener('click', function() {
        change_content('list_of_tests');
    });

if (nav_study_categories_button)
    nav_study_categories_button.addEventListener('click', function() {
        change_content('list_of_categories');
    });

if (nav_images_button)
    nav_images_button.addEventListener('click', function() {
        change_content('images_operations')
    });

if (nav_catalog_tests_button)
    nav_catalog_tests_button.addEventListener('click', function() {
        change_content('list_of_catalog_tests')
    });

if (nav_catalog_posts_button)
    nav_catalog_posts_button.addEventListener('click', function() {
        change_content('list_of_catalog_posts')
    });

if (nav_slider_button)
    nav_slider_button.addEventListener('click', function() {
        change_content('slider_control')
    });

if (logout_button)
    logout_button.addEventListener('click', function () {
        axios({
            url : '/api/logout/',
            method : 'GET',
            withCredentials : true
        }).then(function(res) {
            location.href = '/'
        });
    });

nav_posts = document.getElementsByClassName('nav_posts')
Array.from(nav_posts).forEach(function(post_record) {
    post_record.addEventListener('click', function(e) {
        title = post_record.getAttribute("href")
        e.preventDefault()
        change_content('post', title)
    });
});

function create_test_load(category_id) {

    back_button = document.getElementById('back_to_catalog_button')
    console.log(back_button)
    back_button.addEventListener('click', function(event) {
        event.preventDefault()
        change_content('list_of_tests', category_id)
    });

    document.getElementById('create_test_caption').innerHTML = 'Создание теста'
    test_audience_field = document.getElementById('test_audience')
    test_tradable_block = document.getElementById('block_test_tradable')
    test_status_block = document.getElementById('block_test_status')
    test_category_field = document.getElementById('test_category')

    axios({ // get list of availability categories
        url : '/api/categories',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        data = res.data.data
        data.forEach(function(cat) {
            test_category_field.innerHTML += '<option value="' + cat.id + '">' + cat.name + '</option>'
        });
        console.log(category_id)
        test_category_field.value = (category_id == undefined) ? test_category_field.firstChild.value : (category_id + '')
    });
    function change_category(cat_id) {
        axios({
            url : '/api/category/' + cat_id,
            method : 'GET',
            withCredentials : true
        }).then(function(res) {
            if (res.data.status == 'not_auth')
                location.reload()
            if (res.data.status == 'success') {
                data = res.data.data
                console.log(data)
                if (data.closed == false){
                    test_audience_field.innerHTML = '<option id="shared_test_of_audience" value="Общий тест">Общий тест</option>'
                    test_tradable_block.hidden = true
                    test_status_block.hidden = false
                    test_audience_field.disabled = false
                } else {
                    test_audience_field.innerHTML = ''
                    test_audience_field.value = data.organization_id
                    test_tradable_block.hidden = false
                    test_status_block.hidden = true
                    if (data.organization && data.isSuperAdmin == false) {
                        test_audience_field.value = data.organization_id
                        test_audience_field.disabled = true
                    } else {
                        test_audience_field.disabled = false
                    }
                }
                category = data
                axios({ // get list of availability organizations
                    url : '/api/category/organizations',
                    method : 'GET',
                    withCredentials : true
                }).then(function(res) {
                    if (res.data.status == 'not_auth')
                        location.reload()
                    d = res.data.data
                    d.forEach(function(org) {
                        test_audience_field.innerHTML += '<option value="' + org.name + '">' + org.name + '</option>'
                    });
                    if (category.closed && category.organization) {
                        test_audience_field.value = category.organization
                        test_audience_field.disabled = true
                    }
                });
                test_category_field = document.getElementById('test_category')
                test_notImportant_radio = document.getElementById('test_notImportant')
                test_important_radio = document.getElementById('test_important')
                function status_vision_control(){
                    shared_option = document.getElementById('shared_test_of_audience')
                    if (test_notImportant_radio.checked) {
                        if (shared_option)
                            shared_option.hidden = false
                        test_status_block.hidden = true
                    } else {
                        if (shared_option)
                            shared_option.hidden = true
                            test_audience_field.value = category.organization
                        test_status_block.hidden = false
                    }
                }
                status_vision_control()
                test_notImportant_radio.addEventListener('change', status_vision_control)
                test_important_radio.addEventListener('change', status_vision_control)
            }
        });
    }
    change_category(category_id)
    test_category_field.addEventListener('change', function(event) {
        target = event.target
        change_category(target.value)
    });
    add_question(2)
    check_test_isClosed_fields()
    check_test_important_fields()

    $("#saveTest").on("click", function(){
        data = get_test()
        save_test_button = document.getElementById('saveTest')
        save_test_button.style.visibility = 'hidden'
        if (data == undefined)
            return undefined
        axios({
            url : '/api/test',
            method : 'PUT',
            withCredentials : true,
            data : data
        }).then(function(res) {
            if (res.data.status == 'not_auth')
                location.reload()
            if (res.data.status == 'success') {
                change_content('list_of_tests', category_id)
            } else {
                save_test_button.style.visibility = 'visible'
            }
        });
    });
}

function fill_test_fields(test_id, isOrganizationOnly, fromCatalog) {
    axios({
        url : '/api/test/' + test_id,
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        data = res.data
        if ( data.status == 'success'){
            data = data.data

            if (!fromCatalog){
                back_button = document.getElementById('back_to_catalog_button')
                console.log(back_button)
                back_button.addEventListener('click', function(event) {
                    event.preventDefault()
                    change_content('list_of_tests', data.category_id)
                });
            } else {
                back_button = document.getElementById('back_to_catalog_button')
                console.log(back_button)
                back_button.addEventListener('click', function(event) {
                    event.preventDefault()
                    change_content('list_of_catalog_tests')
                });
            }


            title = document.getElementById('test_title')
            description = document.getElementById('test_description')
            notImportant = document.getElementById('test_notImportant')
            important = document.getElementById('test_important')
            audience = document.getElementById('test_audience')
            status = document.getElementById('test_status')
            tradable = document.getElementById('test_tradable')
            test_audience_field = document.getElementById('test_audience')
            test_tradable_block = document.getElementById('block_test_tradable')
            test_status_block = document.getElementById('block_test_status')
            test_category_field = document.getElementById('test_category')

            console.log(data)
            if (data.isImportant == true) {
                s = document.getElementById('test_status')
                if (data.opened == true)
                    s.value = 'free'
                else
                    s.value = 'notFree'
            }

            // expired fields
            expired_activate_field = document.getElementById('test_expired_activate')
            expired_range_field = document.getElementById('test_expired_range')
            expired_number_field = document.getElementById('test_expired_number')
            if (data.expired) {
                expired_activate_field.checked = true
                expired_range_field.disabled = false
                expired_number_field.disabled = false
                expired_range_field.value = data.expired / 60
                expired_number_field.value = data.expired / 60
            } else {
                expired_activate_field.checked = false
                expired_range_field.disabled = true
                expired_number_field.disabled = true
                expired_range_field.value = 0
                expired_number_field.value = 0
            }

            if (data.category_closed) {
                test_audience_field.innerHTML = ''
                if (test_tradable_block)
                    test_tradable_block.hidden = true
                if (test_status_block)
                    test_status_block.hidden = false
                test_audience_field.disabled = false
            } else {
                test_audience_field.innerHTML = '<option value="Общий тест">Общий тест</option>'
                test_audience_field.value = data.organization_id
                test_tradable_block.hidden = false
                test_status_block.hidden = true
                if (data.organization && data.isSuperAdmin == false) {
                    test_audience_field.value = data.organization_id
                    test_audience_field.disabled = true
                } else {
                    test_audience_field.disabled = false
                }
            }
            if (data.tradable) {
                tradable.value = 'tradable'
            } else {
                tradable.value = 'notTradable'
            }
            test_category_field = document.getElementById('test_category')
            axios({
                url : '/api/category/organizations',
                method : 'GET',
                withCredentials : true
            }).then(function(res) {
                if (res.data.status == 'not_auth')
                    location.reload()
                d = res.data.data
                if (isOrganizationOnly == undefined || isOrganizationOnly == false) {
                    d.forEach(function(org) {
                        test_audience_field.innerHTML += '<option value="' + org.name + '">' + org.name + '</option>'
                    });
                } else if (isOrganizationOnly == true) {
                    d.forEach(function(org) {
                        test_audience_field.innerHTML = '<option value="' + org.name + '">' + org.name + '</option>'
                    });
                    a = test_audience_field[0]
                    test_audience_field.value = a.value
                }
                title.value = data.title
                description.value = data.description
                if (data.isImportant == true) {
                    notImportant.checked = false
                    important.checked = true
                } else {
                    notImportant.checked = true
                    important.checked = false
                }
                if (isOrganizationOnly == undefined || isOrganizationOnly == false) {
                    if (data.category_closed) {
                        audience.value = data.organization
                    } else {
                        audience.value = (data.closed)?  data.organization : 'Общий тест';
                    }
                } else if (isOrganizationOnly == true) {
                    a = audience[0]
                    audience.value = a.value
                }
                status.value = (data.free)? 'free' : 'notFree';
                data.questions.forEach(function(qst, index) {
                    Q = add_question(qst.answers_count)
                    Q.getElementsByClassName('question_text')[0].value = qst.text
                    Q.getElementsByClassName('question_media_url')[0].value = qst.media_url
                    A = Q.getElementsByClassName('answer')
                    Array.from(A).forEach(function(element, i) {
                        element.getElementsByClassName('answer_text')[0].value = qst.answers[i].text
                        element.getElementsByClassName('answer_rights')[0].checked = qst.answers[i].rights
                    });
                });
                check_test_isClosed_fields()
                check_test_important_fields()
                axios({ // get list of availability categories
                    url : '/api/categories',
                    method : 'GET',
                    withCredentials : true
                }).then(function(res) {
                    if (res.data.status == 'not_auth')
                        location.reload()
                    d = res.data.data
                    d.forEach(function(cat) {
                        test_category_field.innerHTML += '<option value="' + cat.id + '">' + cat.name + '</option>'
                    });
                    test_category_field.value = data.category_id
                });
            });
            function change_category(cat_id) {
                test_audience_field = document.getElementById('test_audience')
                test_tradable_block = document.getElementById('block_test_tradable')
                test_status_block = document.getElementById('block_test_status')
                test_category_field = document.getElementById('test_category')
                axios({
                    url : '/api/category/' + cat_id,
                    method : 'GET',
                    withCredentials : true
                }).then(function(res) {
                    if (res.data.status == 'not_auth')
                        location.reload()
                    if (res.data.status == 'success') {
                        data = res.data.data
                        category = data
                        console.log("closed")
                        console.log(data.closed)
                        if (data.closed == false){
                            test_audience_field.innerHTML = '<option value="Общий тест">Общий тест</option>'
                            test_tradable_block.hidden = true
                            test_status_block.hidden = false
                            test_audience_field.disabled = false
                        } else {
                            test_audience_field.innerHTML = ''
                            test_audience_field.value = data.organization_id
                            test_tradable_block.hidden = false
                            test_status_block.hidden = true
                            if (data.organization && data.isSuperAdmin == false) {
                                test_audience_field.value = data.organization_id
                                test_audience_field.disabled = true
                            } else {
                                test_audience_field.disabled = false
                            }
                        }
                        test_category_field = document.getElementById('test_category')
                        axios({ // get list of availability organizations
                            url : '/api/category/organizations',
                            method : 'GET',
                            withCredentials : true
                        }).then(function(res) {
                            if (res.data.status == 'not_auth')
                                location.reload()
                            data = res.data.data
                            data.forEach(function(org) {
                                test_audience_field.innerHTML += '<option value="' + org.name + '">' + org.name + '</option>'
                            });
                           if (category.closed && category.organization) {
                                test_audience_field.value = category.organization
                                test_audience_field.disabled = true
                            }
                        });
                    }
                });
            }
            test_category_field.addEventListener('change', function(event) {
                target = event.target
                console.log(target.options[ target.selectedIndex ])
                change_category(target.value)
            });
        }
    });
}

function edit_test_load(test_id) {
    document.getElementById('create_test_caption').innerHTML = 'Редактирование теста'
    fill_test_fields(test_id)
    $("#saveTest").on("click", function(){
        data = get_test()
        save_test_button = document.getElementById('saveTest')
        save_test_button.style.visibility = 'hidden'
        if (data == undefined)
            return undefined
        axios({
            url : '/api/test/' + test_id,
            method : 'POST',
            withCredentials : true,
            data : data
        }).then(function(res) {
            if (res.data.status == 'not_auth')
                location.reload()
            if (res.data.status == 'success') {
                change_content('list_of_tests', data.category_id)
            } else {
               save_test_button.style.visibility = 'visible'
            }
        });
    });
}

function begin_solution_test(test_id) {
    function start_timer(id, cb) {
        var my_timer = document.getElementById(id);
        var time = my_timer.innerHTML;
        var arr = time.split(":");
        var h = arr[0];
        var m = arr[1];
        var s = arr[2];
        if (s == 0) {
          if (m == 0) {
            if (h == 0) {
              cb()
              return;
            }
            h--;
            m = 60;
            if (h < 10) h = "0" + h;
          }
          m--;
          if (m < 10) m = "0" + m;
          s = 59;
        }
        else s--;
        if (s < 10) s = "0" + s;
        document.getElementById(id).innerHTML = h+":"+m+":"+s;
        timeout_test_timer = setTimeout(start_timer, 1000, id, cb);
    }
    axios({
        url : '/api/test/' + test_id,
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        data = res.data
        if (data.status == 'success') {
            data = data.data
            test_isImportant = data.isImportant
            change_content('test').then(function() {
                quantity_questions = data.questions.length
                questions = []
                data.questions.forEach(function(qst) {
                    answers = []
                    qst.answers.forEach(function(anwr) {
                        answers.push({
                            id : anwr.id,
                            text : anwr.text,
                            checked : false
                        });
                    });
                    questions.push({
                        id : qst.id,
                        text : qst.text,
                        media_url : qst.media_url,
                        answers : answers
                    });
                });
                index = 0
                title = document.getElementById('title');
                current_count= document.getElementById('current_count');
                media_div = document.getElementById('media')
                all_count = document.getElementById('all_count');
                all_count.innerHTML = quantity_questions
                title.innerHTML = data.title + '. ' + data.description
                current_question_index = 0
                function next_question() {
                    if (current_question_index < questions.length-1){
                        current_question_index++;
                    }
                    return current_question()
                }
                function prev_question() {
                    if (current_question_index > 0){
                        current_question_index--;
                    }
                    return current_question()
                }
                function current_question() {
                    return questions[current_question_index]
                }
                function render_question() {
                    question_title = document.getElementById('question-title')
                    question_title.innerHTML = current_question().text
                    answers_div = document.getElementById('answers')
                    html = ""
                    current_question().answers.forEach(function(obj) {
                        html += '<label class="answer" href="' + obj.id + '">'
                            if (obj.checked == true)
                                html += '<input class="radio_answer" type="radio" checked="checked" name="radio">'
                            else
                                html += '<input class="radio_answer" type="radio" name="radio">'
                            html += '<span class="checkmark"></span>'
                            html += '<span class="text answertext">' + obj.text + '</span>'
                        html += '</label>'
                        answers_div.innerHTML = html
                    });
                    current_count.innerHTML = current_question_index+1
                    if (current_question().media_url) {
                        media.style.display = 'block'
                        media.children[0].attributes.href.value = current_question().media_url
                        media.children[0].children[0].attributes.src.value = current_question().media_url
                    } else {
                        media.style.display = 'none'
                    }
                    if (current_question_index == quantity_questions-1) {
                        next_question_button.innerHTML = "Сохранить"
                    } else {
                        next_question_button.innerHTML = "Далее"
                    }
                }
                function save_answers_state() {
                    answers_labels = document.getElementsByClassName('answer')
                    Array.from(answers_labels).forEach(function(element) {
                        current_question().answers.forEach(function(obj) {
                            if (element.attributes.href.value == obj.id) {
                                obj.checked = element.firstChild.checked
                            }
                        });
                    });
                }
                next_question_button = document.getElementById('next_question')
                prev_question_button = document.getElementById('prev_question')
                function send_test(){
                    axios({
                        url : '/api/test/' + test_id + '/check',
                        method : 'POST',
                        data : questions
                    }).then(function(res) {
                        status = res.data.status
                        if (status == 'success') {
                            console.log(test_isImportant)
                            if (test_isImportant == true){
                                document.getElementById('control_test_' + test_id).remove()
                            }
                            change_content('test_conclusion', res.data.data.id) // test_solution id
                        } else {
                            alert(res.data.messages[0])
                        }
                    });
                }
                if (data.expired) {
                    place_for_timer = document.getElementById('place_for_timer')
                    place_for_timer.innerHTML = 'До окончания теста осталось: <span id="test_timer">' + new Date(data.expired * 1000).toISOString().substr(11, 8) + '</span>'
                    start_timer('test_timer', function() {
                        send_test()
                    });
                }
                next_question_button.addEventListener('click', function() {
                   save_answers_state()
                   if (current_question_index == quantity_questions-1) {
                        send_test()
                    }
                   next_question()
                   render_question()
                });
                prev_question_button.addEventListener('click', function() {
                   save_answers_state()
                   prev_question()
                   render_question()
                });
                render_question()
            });
        }
    });
}

function images_operations_load() {
    rows = []
    images_rows = []
    current_page = 0
    next_page_images = document.getElementById('next_page_images')
    prev_page_images = document.getElementById('prev_page_images')
    some_image = document.getElementsByClassName('some_image')
    button_add_new_image = document.getElementById('button_add_new_image')
    button_to_upload_image = document.getElementById('button_to_upload_image')
    Array.from(some_image).forEach(function(block) {
        rows.push({
            main : block,
            img : block.getElementsByClassName('some_image_img')[0],
            a : block.getElementsByClassName('some_image_a')[0],
            input : block.getElementsByClassName('some_image_input')[0],
            button : block.getElementsByClassName('some_image_button')[0]
        })
        block.getElementsByClassName('some_image_button')[0].addEventListener('click', function(event) {
            event.preventDefault()
            target = event.target
            id = target.dataset.id
            axios({
                url : '/api/image/' + id,
                method : 'DELETE',
                withCredentials : true
            }).then(function(res) {
                if (res.data.status == 'success') {
                    change_content('images_operations');
                }
            });
        });
    });
    axios({
        url : '/api/images/',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        if (res.data.status == 'success')
            images_rows = res.data.data
            render_image_list()
    });
    function render_image_list() {
        begin_index = current_page * 4
        index = 0
        while (index < rows.length) {
            if (begin_index + index < images_rows.length) {
                rows[index].main.hidden = false
                rows[index].img.attributes.src.value = images_rows[begin_index+index].url
                rows[index].a.attributes.href.value = images_rows[begin_index+index].url
                rows[index].input.value = images_rows[begin_index+index].url
                rows[index].button.dataset.id = images_rows[begin_index+index].id
            } else {
                rows[index].main.hidden = true
            }
            index++;
        }
    }
    next_page_images.addEventListener('click', function(event) {
        if ( ( (current_page * rows.length) + 1) < images_rows.length) {
            console.log(current_page)
            current_page += 1
            render_image_list(current_page)
        }
    });
    prev_page_images.addEventListener('click', function(event) {
        if ( ( (current_page-1) * rows.length) >= 0) {
            console.log(current_page)
            current_page -= 1
            render_image_list(current_page)
        }
    });
    $(function(){ $("#button_add_new_image").fancybox(); });
    button_add_new_image.addEventListener('click', function(event) {

    });
    button_to_upload_image.addEventListener('click', function(event){
        event.preventDefault()
        var formData = new FormData();
        var imagefile = document.getElementById('image_to_upload');
        formData.append("file", imagefile.files[0]);
        axios.post('/api/upload_image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
        }).then(function(res) {
            if (res.data.status == 'not_auth')
                location.reload()
            data = res.data
            if (data.status == "success") {
                $.fancybox.close();
                change_content('images_operations')
            }
        });
    });
}

function list_of_catalog_tests_load() {
    root_node = document.getElementById('catalog_tests')
    tests_refs = root_node.getElementsByClassName('some_test')
    Array.from(tests_refs).forEach(function(test){
        test.getElementsByClassName('test_show')[0].addEventListener('click', function(event) {
            event.preventDefault();
            target = event.target
            change_content('appoint_test', +target.attributes.href.value);
        });
    });
}

function appoint_test_load(test_id) {
    document.getElementById('create_test_caption').innerHTML = 'Добавление теста'
    fill_test_fields(test_id, true, true);
    audience = document.getElementById('test_audience')
    tradable = document.getElementById('test_tradable')
    block_tradable = document.getElementById('block_test_tradable')
    tradable.value = 'notTradable'
    block_tradable.style.display = 'none'
    audience.disabled = true
    $("#saveTest").on("click", function(){
        data = get_test()
        save_test_button = document.getElementById('saveTest')
        save_test_button.style.visibility = 'hidden'
        if (data == undefined)
            return undefined
        data.old_test_id = test_id
        axios({
            url : '/api/appoint_test/' + test_id,
            method : 'PUT',
            withCredentials : true,
            data : data
        }).then(function(res) {
            console.log(res)
            console.log(res.data)
            console.log(res.data.status)
            if (res.data.status == 'not_auth')
                location.reload()
            if (res.data.status == 'success') {
                change_content('list_of_tests', data.category_id)
            } else {
                save_test_button.style.visibility = 'visible'
            }
        });
    });
}

function list_of_catalog_posts_load() {
    root_node = document.getElementById('catalog_article')
    posts_refs = root_node.getElementsByClassName('some_article')
    Array.from(posts_refs).forEach(function(post){
        article_appoint = post.getElementsByClassName('article_appoint')[0]
        article_title = post.getElementsByClassName('article_title')[0]
        article_appoint.addEventListener('click', function(event) {
            event.preventDefault();
            target = event.target
            category_id = target.parentNode.getElementsByClassName('article_category')[0].value
            axios({
                url : '/api/category/' + category_id + '/appoint_post/' + +target.attributes.href.value,
                method : 'POST',
                withCredentials : true
            }).then(function(res) {
                data = res.data
                if (data.status == 'not_auth')
                    location.reload()
                if (data.status == 'success') {
                    change_content('post', data.data.post_id)
                }
            });
        });
        article_title.addEventListener('click', function(event) {
            event.preventDefault()
            target = event.target
            change_content('post', +target.attributes.href.value)
        });
    });
}

function test_conclusion_load(test_solution_id) {
    fio = document.getElementById('feedback_fio')
    phone_number = document.getElementById('feedback_phone_number')
    email_user = document.getElementById('feedback_email_user')
    email_admin = document.getElementById('feedback_email_admin')
    submit = document.getElementById('feedback_submit')
    right_answers_count = document.getElementById('right_answers')
    all_answers = document.getElementById('all_answers')
    submit.addEventListener('click', function(event) {
        event.preventDefault();
        submit.style.display = 'none'
        questions = []
        conclusion_question = document.getElementsByClassName('conclusion_question')
        console.log(conclusion_question)
        Array.from(conclusion_question).forEach(function(qst) {
            questions_block = document.getElementById('block_questions')
            if (questions_block) {
                index = qst.getElementsByClassName('conclusion_index')[0]
                text = qst.getElementsByClassName('conclusion_text')[0]
                user_answer = qst.getElementsByClassName('conclusion_user_answer')[0]
                right_answers = qst.getElementsByClassName('conclusion_right_answers')[0]
                temporary_question = {
                    index : index.innerText,
                    text : text.innerText,
                    user_answer : user_answer.innerText,
                    right_answers : []

                }
                Array.from(right_answers.getElementsByClassName('conclusion_right_answer')).forEach(function(ra) {
                    temporary_question.right_answers.push(ra.innerText)
                });
                questions.push(temporary_question)
            }
        });
        axios({
            url : '/api/send_feedback/',
            method : 'POST',
            withCredentials : true,
            data : {
                "fio" : fio.value,
                "phone_number" : phone_number.value,
                "email_user" : email_user.value,
                "email_admin" : email_admin.value,
                "right_answers" : right_answers_count.innerText,
                "all_answers" : all_answers.innerText,
                "questions" : questions,
                "test_solution_id" : test_solution_id
            }
        }).then(function(res) {
            if (res.data.status == 'success') {
                feedback_form = document.getElementById('feedback_form')
                feedback_form.innerHTML = '<h3 class="success">Результаты вашего теста были отправлены<h3>'
            } else {
                span_error = document.getElementById('feedback_auth_error')
                span_error.innerHTML = res.data.messages[0]
                submit.style.display = 'block'
            }
        });
    });
}

function slider_control_load() {

    MAX_SLIDES = 10
    slides = []
    slides_count = 0
    slides_container = document.getElementById('slides_container')
    add_slide_button = document.getElementById('addSlide')
    save_slides_button = document.getElementById('saveSliderChanges');

    add_slide_button.addEventListener('click', function(event) {
        event.preventDefault()
        insert_slide()
    });

    save_slides_button.addEventListener('click', function() {
        save_slides_button.style.visibility = 'hidden'
        axios({
            url : '/api/slider/slides',
            method : 'POST',
            withCredentials : true,
            data : get_slides()
        }).then(function(res) {
            data = res.data
            status = data.status
            if (status == 'error')
                save_slides_button.style.visibility = 'visible'
            if (status == 'success')
                change_content('main')

        });
    });

    $('#slides_container').on('click', '.some_image_button', function(event) {
        target = event.target
        block = target.parentNode.parentNode
        block.remove()
        slides_count -= 1
    });

    // slide_info fields
    // - reference
    // - image_url
    // - index
    function build_slide(slide_info) {
        if (!slide_info)
            slide_info = {
                index : ( document.getElementsByClassName('some_image') ).length + 1,
                image_url : '',
                reference : ''
            }
        html = ''
        html += '<div class="row mb-4 some_image" data-index="' + slide_info.index + '">'
        html +=    '<div class="col-4">'
        html +=        '<div class="stock">'
        html +=            '<a class="some_image_a" href="' + slide_info.image_url + '" data-fancybox="images" data-caption="My caption">'
        html +=                '<img class="some_image_img" src="' + slide_info.image_url + '" alt=""/>'
        html +=            '</a>'
        html +=        '</div>'
        html +=    '</div>'
        html +=    '<div class="col-7">'
        html +=        '<div class="container-fluid">'
        html +=            '<div class="row"><input class="some_image_input_reference" style="width:100%;" type="text" placeholder="URL для перехода" value="' + slide_info.reference + '"></div>'
        html +=            '<div class="row"><input class="some_image_input_image" style="width:100%;" type="text" placeholder="URL изображения" value="' + slide_info.image_url + '"></div>'
        html +=        '</div>'
        html +=    '</div>'
        html +=    '<div class="col-1 pt-3">'
        html +=        '<input class="some_image_button btn btn-danger" readonly type="button" value="X ">'
        html +=    '</div>'
        html += '</div>'
        return html
    }

    function insert_slide(slide_info){
        if (slides_count < MAX_SLIDES) {
            slides_container.innerHTML  += build_slide(slide_info)
            slides_count += 1
        }
    }

    function load_slides() {
        return new Promise(function(resolve, reject) {
            axios({
                url : '/api/slider/slides',
                method : 'GET',
                withCredentials : true
            }).then(function(res) {
                if (res.data.status != 'success')
                    reject()
                slides_data = res.data.data
                slides_data.forEach(function(s, i) {
                    insert_slide({
                        reference : s.image_reference,
                        image_url : s.image_url,
                        index : s.image_index,
                    })
                });
                console.log(slides_data.length)
                slides_count = slides_data.length
                resolve();
            });
        });
    }

    function get_slides() {
        slide_elements = document.getElementsByClassName('some_image')
        console.log(slide_elements)
        return_array = []
        Array.from(slide_elements).forEach(function(element, index) {
              console.log(index)
              return_array.push({
                image_url : (element.getElementsByClassName('some_image_input_image')[0]).value,
                image_reference : (element.getElementsByClassName('some_image_input_reference')[0]).value,
                image_index : index + 1
              });
        });
        return return_array
    }
    load_slides().then(function() {
        console.log(get_slides())
    });
}

function search_list_load() {

}

function edit_user_load(user_id) {
    let edit = {
        first_name : document.getElementById('edit_first_name'),
        second_name : document.getElementById('edit_second_name'),
        email : document.getElementById('edit_email'),
        phone_number : document.getElementById('edit_phone_number'),
        submit : document.getElementById('edit_submit')
    }
    axios({
        url : '/api/user/' + user_id,
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        data = res.data
        status = data.status
        if (status == 'error')
            return
        if (status == 'success') {
            user_role = data.user.role
            user_info = data.data
            if (user_role == 'super_admin') {
                edit.select_organization = document.getElementById('edit_select_organization')
                edit.input_organization = document.getElementById('edit_input_organization')
                edit.new_org = document.getElementById('edit_new_org')
                edit.like_admin = document.getElementById('edit_like_admin')
                edit.password = document.getElementById('edit_password')
                edit.confirm_password = document.getElementById('edit_confirm_password')
                edit.new_org.addEventListener('click', function() {
                    if (edit.new_org.checked) {
                        edit.select_organization.hidden = true
                        edit.input_organization.hidden = false
                    } else {
                        edit.select_organization.hidden = false
                        edit.input_organization.hidden = true
                        build_organization_list()
                    }
                });
            } else if (user_role == 'admin') {

            } else {

            }
            edit.submit.addEventListener('click', function (event) {
                event.preventDefault()
                edit.submit.style.visibility = 'hidden'
                axios({
                    url : '/api/user/' + user_id,
                    method : 'POST',
                    withCredentials : true,
                    data : function() {
                        if (user_role == 'admin') {
                            return {
                                first_name : edit.first_name.value,
                                second_name : edit.first_name.value,
                                email : edit.first_name.value,
                                phone_number : edit.first_name.value
                            }
                        } else if (user_role == 'super_admin') {
                            return {
                                first_name : edit.first_name.value,
                                second_name : edit.second_name.value,
                                email : edit.email.value,
                                phone_number : edit.phone_number.value,
                                organization_id : (edit.new_org.checked)? null : edit.select_organization.value,
                                organization_name : (edit.new_org.checked)? edit.input_organization.value : edit.select_organization[edit.select_organization.selectedIndex].innerHTML,
                                isNewOrg : edit.new_org.checked,
                                like_admin : edit.like_admin.checked,
                                password : edit.password.value,
                                confirm_password : edit.confirm_password.value
                            }
                        } else {
                            return {}
                        }
                    }()
                }).then(function(res) {
                    data = res.data
                    if (data.status == 'error'){
                        edit_submit.style.visibility = 'visible'
                        reg_messages = document.getElementById('edit_messages')
                        reg_messages.innerHTML = ""
                        data['messages'].forEach(function(element) {
                            reg_messages.innerHTML += '<li class="denied">' + element + "</li>"
                        });
                        return undefined
                    }
                    if (data.status == 'success') {
                        change_content('list_of_users')
                    }

                });
            });
        }
    });
}

function begin_hire_of_user(user_id) {
    axios({
        url : '/api/user/' + user_id + '/restore',
        method : 'POST',
        withCredentials : true
    }).then(function(res) {
        data = res.data
        if (data.status == 'error')
            return undefined
        if (data.status == 'success') {
            users_table.deleteRow(user_id)
        }
    });
}

function archive_of_users_load() {
    axios({
        url : '/api/archive/users',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        if (res.data.status == 'error')
            return undefined
        user_data = res.data.user
        archived_users = res.data.data
        data_for_table = []
        archived_users.forEach(function(element){
            data_for_table.push({
                id : element.id,
                username : element.first_name + " " + element.second_name,
                tests_count : element.tests_count,
                average_score : (element.average_score).toFixed(2),
                prev_organization_name : (element.prev_organization_name)? element.prev_organization_name : 'Неизвестно',
            });
        });
        users_table = new Tabulator('#archive_of_users_table', {
            data : data_for_table,
            layout : 'fitColumns',
            movableColumns : false,
            resizableRows : false,
            index : 'id',
            initialSort: [             //set the initial sort order of the data
                {column:"username", dir:"asc"},
            ],
            columns : [
                { title: 'ФИО', field: 'username'},
                { title: 'Количество тестов', field: 'tests_count', align: 'center' },
                { title: 'Средний балл', field: 'average_score', align: 'center'},
                { title: 'Прошлая организация', field: 'prev_organization_name', align: 'center', formatter:'string'},
                { title : 'Действия', formatter: function formatters_buttons_cell(cell, formatterParams) {
                    function make_ref(text, href, type) {
                        if (type == 1){
                            id = 'details_' + cell.getData().id
                            onclick_text = 'begin_details_of_user("' + cell.getData().id + '")'
                            return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                        } else if (type == 2) {
                            id = 'hire_user_' + cell.getData().id
                            onclick_text = 'begin_hire_of_user("' + cell.getData().id + '")'
                            return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                        } else if (type == 3) {
                            id = 'edit_user_' + cell.getData().id
                            onclick_text = 'begin_edit_of_user("' + cell.getData().id + '")'
                            return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                        }
                    }
                    details = 'Подробнее'
                    hire_user = 'Принять в организацию'
                    edit_user = 'Редактировать'
                    details = make_ref(details, '#', 1)
                    hire_user = make_ref(hire_user, '#', 2)
                    edit_user = make_ref(edit_user, '#', 3)
                    if (user_data.role == 'super_admin'){
                        return details + '<br>' + edit_user + '<br>' + hire_user
                    } else {
                        return details + '<br>' + hire_user
                    }
                }
                , width: 228}
            ]
        });
    });
}

organizations_table = undefined

function begin_edit_organization(org_id, isArchive=false) {
    elements = {
        input : document.getElementById('restore_org_input'),
        submit : document.getElementById('restore_org_submit'),
        users_view : document.getElementById('users_view')
    }
    organization_name =  organizations_table.getRow(org_id).getData().name
    elements.input.value = organization_name
    if (!isArchive) {
        axios({
            url : '/content/users',
            method : 'GET',
            withCredentials : true
        }).then(function(res) {
            html = res.data
            elements.users_view.innerHTML = html
            list_of_users_load(organization_name)
        });
    }
    elements.submit.addEventListener('click', function(event) {
        target = event.target
        target.style.visibility = 'hidden'
        axios({
            url : '/api/organization/' + org_id,
            method : 'POST',
            data : {
                name : elements.input.value
            }
        }).then(function(res) {
            status = res.data.status
            if (status == 'error')
                target.style.visibility = 'visible'
            else if(status == 'success') {
                $.fancybox.close()
                if (isArchive)
                    change_content('archive_of_organizations')
                else
                    change_content('list_of_organizations')
            }
        });
    });
}

function begin_restore_organization(org_id) {
    axios({
        url : '/api/organization/' + org_id + '/restore',
        method : 'POST',
        withCredentials : true
    }).then(function(res) {
        status = res.data.status
        if (status == 'error')
            return undefined
        if (status == "success"){
            organizations_table.deleteRow(org_id)
        }
    });
}

function archive_of_organizations_load() {
    axios({
        url : '/api/archive/organizations',
        method : 'GET',
        withCredentials : true
    }).then(function(res) {
        if (res.data.status == 'not_auth')
            location.reload()
        if (res.data.status == 'error')
            return undefined
        user_data = res.data.user
        archived_orgs = res.data.data
        data_for_table = []
        archived_orgs.forEach(function(element){
            data_for_table.push({
                id : element.id,
                name : element.name,
                isArchived : element.isArchived,
            });
        });
        organizations_table = new Tabulator('#archive_of_organizations_table', {
            data : data_for_table,
            layout : 'fitColumns',
            movableColumns : false,
            resizableRows : false,
            index : 'id',
            initialSort: [             //set the initial sort order of the data
                {column:"name", dir:"asc"},
            ],
            columns : [
                { title: 'Название', field: 'name'},
                { title : 'Действия', formatter: function formatters_buttons_cell(cell, formatterParams) {
                    function make_ref(text, href, type) {
                        if (type == 1){
                            id = 'edit_organization_' + cell.getData().id
                            onclick_text = 'begin_edit_organization(' + cell.getData().id + ', true)'
                            return '<a id="' + id + '" href="' + href + '" onclick="' + onclick_text + '">' + text + '</a>'
                        } else if (type == 2) {
                            id = 'restore_organization_' + cell.getData().id
                            onclick_text = 'begin_restore_organization("' + cell.getData().id + '")'
                            return '<a id="' + id + '" href="' + href + '" onclick=' + onclick_text + '>' + text + '</a>'
                        }
                    }
                    edit_org = 'Редактировать'
                    restore_org = 'Восстановить'
                    edit_org = make_ref(edit_org, '#edit_org_block', 1)
                    restore_org = make_ref(restore_org, '#', 2)
                    $(function(){
                        $("#edit_organization_" + cell.getData().id).fancybox();
                    });
                    return edit_org + '<br>' + restore_org
                }
                , width: 228}
            ]
        });
    });
}

function feedback_page_load() {
    elements = {
        name : document.getElementById('feedback_page_name'),
        email : document.getElementById('feedback_page_email'),
        text : document.getElementById('feedback_page_text'),
        submit : document.getElementById('feedback_page_submit'),
    }
    elements.submit.addEventListener('click', function(event) {
        event.preventDefault()
        target = event.target
        target.style.visibility = 'hidden'
        axios({
            url : '/api/simple_feedback',
            method : 'POST',
            withCredentials : true,
            data : {
                name : elements.name.value,
                email : elements.email.value,
                text : elements.text.value
            }
        }).then(function(res) {
            status = res.data.status
            if (status == 'error')
                target.style.visibility = 'hidden'
            if (status == 'success')
                change_content('main')
        });
    });
}

// main actions
show_post_element = document.getElementById('show_post')
if (show_post_element)
    change_content('post', +show_post_element.dataset.post)
else
    change_content('main')