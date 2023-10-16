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

$(document).ready(function() {
    

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
        },
        error: function(err) {
            const data = err.responseJSON;
            showMessage(data.message);
        }
        });
    });

    loginForm.on("submit", function(e) {
        e.preventDefault();
        const username = $("#login-username").val();
        const password = $("#login-password").val();

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
    });
});


