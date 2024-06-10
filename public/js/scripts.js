function showPassword() {
    var password = document.getElementById("inputPassword");
    if (password.type === "password") {
      password.type = "text";
    } else {
      password.type = "password";
    }
  }

const profilePicture = document.querySelector('.avatar-picture')
function getPicture(picture) {
  var url = picture.value;
  profilePicture.src = url;
}

