function openRegister(){
    $("#login").hide()
    $("#register").show()
    $("#message").hide()
}

function closeRegister(){
    $("#login").show()
    $("#register").hide()
    $("#message").hide()
}

function showMessage(msg){
    $("#message").show()
    $("#message").html(msg)
}

//disable whitespaces
$(function() {
    $('input[type=text]').on('keypress', function(e) {
        if (e.keyCode == 32)
            e.preventDefault();
    });
});

function loginAjax(username, password){
    $.ajax({
    type: "POST",
    url: "/login",
    contentType: "application/json",
    data: JSON.stringify({ username, password }),
    success: function(data) {
        const token = data.token;
        localStorage.setItem("token", token);
        showMessage("Login successful!");
        //redirect
        window.location.href="chat.html";
    },
    error: function(err) {
        const data = err.responseJSON;
        showMessage(data.message);
    }
    });
}


$(document).ready(function() {
    //if logged in redirect
    setTimeout(function () {
        const token = localStorage.getItem('token');
        if (token !== null) {
           window.location.href="chat.html"
        }
      }, 0);
     
    
    const registerForm = $("#register");
    const loginForm = $("#login");

    registerForm.on("submit", function(e) {
        e.preventDefault();
        const username = $("#register-username").val();
        const password1 = $("#register-password1").val();
        const password2 = $("#register-password2").val();
        $.ajax({
        type: "POST",
        url: "/register",
        contentType: "application/json",
        data: JSON.stringify({ username, password1, password2 }),
        success: function(data) {
            showMessage("Registration successful!");
            loginAjax(username, password1);
        },
        error: function(err) {
            const data = err.responseJSON;
            showMessage(data.message);
        }
        });
    });

    loginForm.on("submit", function(e) {
        e.preventDefault();
        loginAjax($("#login-username").val(), $("#login-password").val());
    })
});


