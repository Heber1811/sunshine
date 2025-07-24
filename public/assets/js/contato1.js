function enviarMensagem(){
    var camposObrigatorios = 0
    $('.obrigatorio').each(function(){
        if($(this).val() == ""){
            camposObrigatorios += 1
        }
    })
    
    if(camposObrigatorios > 0){
        new Swal("Atenção", 'Por favor preencha todos os campos com "*" para prosseguir!', "error")
        return
    }

    var text = ""

    text += `*Nome Completo:* ${$('#nome').val()}%0a`
    text += `*E-mail:* ${$('#email').val()}%0a`
    text += `*Assunto:* ${$('#assunto').val()}%0a`
    text += `*Mensagem:* ${$('#mensagem').val()}%0a`
    
    window.location.href = 'https://wa.me/5562999147450?&text=' + text
}