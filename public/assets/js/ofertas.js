function checarEmail() {
  if (document.forms[0].email.value == ""
    || document.forms[0].email.value.indexOf('@') == -1
    || document.forms[0].email.value.indexOf('.') == -1) {
    new Swal("Ops", "Este email é inválido. Tente novamente", "error");
    return false;
  }
}

function salvarEmail() {
  var email = ('#email_oferta')
  if (document.forms[0].email.value == ""
    || document.forms[0].email.value.indexOf('@') == -1
    || document.forms[0].email.value.indexOf('.') == -1) {
    if ($('#email_oferta').val() == "") {
      new Swal("Atenção", 'por favor preencha o campo "Email" para cadastrar!', "error");
      return
    }
    new Swal
      ("Ops", "Este email é inválido. Tente novamente", "error");
    return false;
  }

  var objEmail = {
    email: $('#email').val(),
    cadastrado_em: new Date()
  }

  firebase.firestore()
    .collection("email")
    .add(objEmail).then(function () {
      new Swal({
        icon: "success", text: "Email cadastrado com sucesso", confirmButtonText: " Cadastrado ! "
      })
    })
}







