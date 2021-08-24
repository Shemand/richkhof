auth_div = document.getElementById('auth')
if (auth_div)
    auth_div.addEventListener('click', function(event) {
        openAuthModel(0)
    });
function openAuthModel(viewFlag = 0) { // if 0 then then open auth else if 1 open restore

    function insert_auth() {
        auth_modal = document.getElementById('auth-modal')
        html = ""
        html += '<form action="">'
            html += '<div class="header">Авторизация</div>'
            html += '<span class="denied mb-2"><ul id="auth_message"></ul></span>'
            html += '<input id="auth_phone_number" type="text" placeholder="79999999999">'
            html += '<input id="auth_password" type="password" placeholder="Пароль">'
            html += '<input id="auth_submit" type="button" class="button black-button" value="Войти">'
            html += '<a href="" id="restore_link">Забыли пароль?</a>'
        html += '</form>'
        auth_modal.innerHTML = html
    }

    function insert_restore() {
        auth_modal = document.getElementById('auth-modal')
        html = ''
        html += '<form action="">'
            html += '<div class="header">Авторизация</div>'
            html += '<span class="denied mb-2"><ul id="restore_message"></ul></span>'
            html += '<input id="restore_email" type="text" placeholder="example@mail.com">'
            html += '<input id="restore_submit" type="button" class="button black-button" value="Восстановить">'
            html += '<a href="" id="auth_link">Авторизироваться</a>'
        html += '</form>'
        auth_modal.innerHTML = html
    }

    if (viewFlag == 0) {
        insert_auth()
        auth_phone_number = document.getElementById('auth_phone_number')
        auth_password = document.getElementById('auth_password')
        auth_submit = document.getElementById('auth_submit')
        auth_messages = document.getElementById('auth_message')
        restore_link = document.getElementById('restore_link')
        function auth() {
            axios({
                url : "/api/authorization",
                method : "POST",
                withCredentials : true,
                data : {
                    phone_number : auth_phone_number.value,
                    password : auth_password.value
                }
            }).then(function(res) {
            console.log(res)
                data = res.data
                auth_message.innerHTML = ""
                if ('status' in data && (data['status'] == 'error') ) {
                   data['messages'].forEach(function(element) {
                        auth_messages.innerHTML += '<li class="denied">' + element + "</li>"
                   });
                } else {
                    location.reload()
                }
            });
        }
        $("#auth_phone_number, #auth_password").keyup(function(event){
            if(event.keyCode == 13){
                auth()
            }
        });
        restore_link.addEventListener('click', function(e) {
            e.preventDefault()
            openAuthModel(1)
        });
        auth_submit.addEventListener('click', function(e) {
            auth()
        });
    } else if (viewFlag == 1) {
        insert_restore()
        restore_email = document.getElementById('restore_email')
        restore_messages = document.getElementById('restore_message')
        restore_submit = document.getElementById('restore_submit')
        auth_link = document.getElementById('auth_link')
        function restore() {
            axios({
                url : "/api/restore/password",
                method : "POST",
                withCredentials : true,
                data : {
                    email : restore_email.value
                }
            }).then(function(res) {
            console.log(res)
                data = res.data
                restore_message.innerHTML = ""
                if ('status' in data && (data['status'] == 'error') ) {
                   data['messages'].forEach(function(element) {
                        restore_messages.innerHTML += '<li class="denied">' + element + "</li>"
                   });
                } else {
                    location.reload()
                }
            });
        }
//        $("#restore_email).keyup(function(event){
//            if(event.keyCode == 13){
//                restore()
//            }
//        });
        auth_link.addEventListener('click', function(e) {
            e.preventDefault()
            openAuthModel(0)
        });
        restore_submit.addEventListener('click', function(e) {
            restore()
        });
    }

}