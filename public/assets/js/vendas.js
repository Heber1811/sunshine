$(document).ready(function () {
    $("#nome").select2({
        dropdownParent: $('#modal_venda')
    });
    $("#produto_nome").select2({
        dropdownParent: $('#modal_venda')
    });


    window.tabelaVendas = $("#tabela_vendas").DataTable({
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.11.3/i18n/pt_br.json"
        }
    })

    $(".nav_tab").on('click', function () {
        $(".nav_tab").removeClass('active')
        $(this).addClass("active")
        $('.row_tab').hide()
        var idRow = $(this).attr("href")
        $(idRow).show()
    })

    var dh = new Date()
    dh.setDate(dh.getDate() - 2)
    var dia = dh.getDate().toString().padStart(2, '0')
    var dataIni = `${dh.getFullYear()}-${(dh.getMonth() + 1).toString().padStart(2, '0')}-${dia}`

    dh.setDate(dh.getDate() + 4)
    var dia = dh.getDate().toString().padStart(2, '0')
    var dataFim = `${dh.getFullYear()}-${(dh.getMonth() + 1).toString().padStart(2, '0')}-${dia}`

    $("#data_inicial").val(dataIni)
    $("#data_final").val(dataFim)

    firebase.auth().onAuthStateChanged(function (usuarioLogado) {
        if (usuarioLogado) {
            $('#navbarDropdownMenuLink').html(usuarioLogado.email)
            buscarVendas()
            $('#load').hide()
        } else {
            location.href = './'
        }
    })
})



function buscarVendas() {
    var dataIni = $("#data_inicial").val()
    dataIni = new Date(dataIni)

    var dataFim = $("#data_final").val()
    dataFim = new Date(dataFim)

    firebase.firestore().collection("vendas")
        .where("data_venda", ">", dataIni)
        .where("data_venda", "<", dataFim)
        .get().then(function (vendas) {
            window.tabelaVendas.clear()
            window.tabelaVendas.draw(false)
            var precoVenda = 0
            var precoCompra = 0
            $.each(vendas.docs, function (indice, venda) {
                firebase.firestore().collection("login").doc(venda.data().comprador).get().then(function (comprador) {
                    var valorCompra = 0
                    var valorVenda = 0
                    var dv = venda.data().data_venda.toDate()
                    var dia = dv.getDate().toString().padStart(2, '0')
                    var mes = (dv.getMonth() + 1).toString().padStart(2, '0')
                    dv = `${dia}/${mes}/${dv.getFullYear()} - ${dv.getHours()}:${dv.getMinutes()}`
                    var status = (venda.data().status ? venda.data().status : " Aguardando Confirmação")
                    $.each(venda.data().itens, function () {
                        valorVenda += this.qtd * this.dados.preco_venda
                        valorCompra += this.qtd * this.dados.preco_compra
                    })
                    window.tabelaVendas.row.add([
                        `${venda.id}<br><b style="white-space: nowrap">${status}</b>`,
                        dv,
                        `${comprador.data().nome}<br><b style="color:#f27649">${venda.data().itens.length} Produto(s)</b>`,
                        `R$${valorVenda.toLocaleString('pt-br', { minimumFractionDigits: 2 })}`,
                        `<i style="cursor:pointer" onclick="verVenda('${venda.id}')" class="fas fa-eye"></i>`
                    ]).node().id = venda.id;
                    window.tabelaVendas.draw(false)
                    precoVenda += valorVenda
                    precoCompra += valorCompra
                    var precoLucro = precoVenda - precoCompra
                    $("#total_vendido").html(precoVenda.toLocaleString('pt-br', { minimumFractionDigits: 2 }))
                    $("#total_lucro").html(precoLucro.toLocaleString('pt-br', { minimumFractionDigits: 2 }))
                })
            })

        }).catch(function (err) {
            console.log(err)
        })
}




function verVenda(idVenda){
    $("#modal_venda").find('input').val('')
    $("#nome").html('')
    $("#produto_nome").html('')
    firebase.firestore().collection("vendas")
    .doc(idVenda).get().then(function(venda){
            firebase.firestore().collection("login").doc(venda.data().comprador).get().then(function (comprador){
                window.idVendaAtual = idVenda
                if(venda.data().status){
                    $("#venda_situacao").val(venda.data().status)
                }
                var nome =  comprador.data().nome
                $("#nome").append(`<option value="${nome}">${nome}</option>`)
                $("#nome").val(nome)
                if(venda.data().pagamento_confirmado){
                    $('#btn-salvar-venda').hide()
                    $('#nome').prop('disabled', true)
                    $('#venda_situacao').prop('disabled', true)
                }else{
                  
                    $('#nome').prop('disabled', false)
                    $('#venda_situacao').prop('disabled', false)
                    $('#btn-salvar-venda').show()
                }
                $("#cpf").val(comprador.data().cpf ? comprador.data().cpf : "")
                $("#data_nascimento").val(comprador.data().data_nascimento ? comprador.data().data_nascimento : "")
                $("#celular").val(comprador.data().celular)
                $("#email").val(comprador.data().email ? comprador.data().email : "")
                $("#cep").val(venda.data().destinatario.cep)
                $("#logradouro").val(venda.data().destinatario.logradouro)
                $("#numero").val(venda.data().destinatario.numero)
                $("#complemento").val(venda.data().destinatario.complemento)
                $("#bairro").val(venda.data().destinatario.bairro)
                $("#cidade").val(venda.data().destinatario.cidade)
                $("#estado").val(venda.data().destinatario.estado)
                $("#lista_itens").html('')
              
                var valorTotalVenda = 0
                var valorTotalCompra = 0
                $.each(venda.data().itens, function(index, produto){
                    var  valorTotalVenda = 0
                    var  valorTotalCompra = 0
                    valorTotalVenda += produto.qtd * produto.dados.preco_venda
                    valorTotalCompra += produto.qtd * produto.dados.preco_compra
                    $('#itens-venda').append(
                        `
                            <tr>
                            <td>${index + 1}</td>
                            <td>${produto.qtd}</td>
                            <td>${produto.dados.nome}</td>
                            <td>${produto.qtd * produto.dados.preco_venda.toLocaleString('pt-br', {minimumFractionDigits: 2})}</td>
                            <td>${produto.qtd * produto.dados.preco_compra.toLocaleString('pt-br', {minimumFractionDigits: 2})}</td>
                            </tr>
                       `)
                })

                $('#valor-total-venda').html(`<b> Valor Total bruto</b> R$ ${valorTotalVenda.toLocaleString('pt-br', {minimumFractionDigits: 2})}`)
                $('#valor-total-liquido').html(`<b> Valor Total liquido</b>  R$ ${(valorTotalVenda - valorTotalCompra).toLocaleString('pt-br', {minimumFractionDigits: 2})}`)
                $("#modal_venda").find('input').prop('disabled', true)
                $("#modal_venda").modal('show')
         })
                
    })
}


function salvarVenda(){
    var destinatario = {
    nome : $("#nome").find('option:selected').text() ,
    celular : $("#celular").val(),
    email : $("#email").val(),
    cep : $("#cep").val(),
    logradouro : $("#logradouro").val(),
    numero : $("#numero").val(),
    complemento : $("#complemento").val(),
    bairro : $("#bairro").val(),
    cidade : $("#cidade").val(),
    estado : $("#estado").val(),
    }


    var venda = {
        status: $("#venda_situacao").val(),
        destinatario: destinatario,
        itens: window.itensVenda,
        comprador: $("#nome").val(),
        data_venda: new Date()
    }

    firebase.firestore().collection('vendas').add(venda).then(function(){
        window.itensVenda = null
        vendaGravadaComSucesso()
    })

   

}

function vendaGravadaComSucesso() {
    new Swal({
        title: "Pronto!",
        icon: "success",
        text: "Venda salva com sucesso"
    }).then(function () {
        location.reload()
    })
}


function novaVenda() {
    $("#nome").select2('destroy');
    $("#produto_nome").select2('destroy');
    $("#modal_venda").find('input').val('')
    $("#nome").html('<option value="">Selecionar</option>').prop('disabled', false)
    $("#nome").on('change', function () { selecionarCliente() })
    $("#produto_nome").html('<option value="">Selecionar</option>')
    $('#valor-total-venda').html('')
    $('#valor-total-liquido').html('')
    $("#lista_itens").html('')
    window.idVendaAtual = null
    window.itensVenda = []
    firebase.firestore().collection("login").get()
        .then(function (cli) {
            window.clientesVendas = {}
            $.each(cli.docs, function () {
                window.clientesVendas[this.id] = this.data()
                $("#nome").append(`<option value="${this.id}">${this.data().nome} - ${this.data().cpf ? this.data().cpf: "" }</option>`)

            })
        })

    firebase.firestore().collection("produtos").where("deletado", "==", false).get()
        .then(function (pro) {
            window.produtosVendas = {}
            $.each(pro.docs, function () {
                window.produtosVendas[this.id] = this.data()
                $("#produto_nome").append(`<option value="${this.id}">${this.data().nome}</option>`)

            })

        })

    $("#nome").select2({
        dropdownParent: $('#modal_venda')
    });
    $("#produto_nome").select2({
        dropdownParent: $('#modal_venda')
    });
    $("#modal_venda").modal("show")
}

function adicionarProdutoVenda(){
    if($("#produto_nome").val() == ""){
        new Swal ("Atenção", 'Por favor selecione o produto para prosseguir!', "error")
        return
}

if($("#produto_qtd").val() == ""){
    new Swal ("Atenção", 'Por favor informe a quantidade para prosseguir!', "error")
    return
}

var item = {
    qtd: parseInt($("#produto_qtd").val()),
    dados:window.produtosVendas[$('#produto_nome').val()]

}

window.itensVenda.push(item)
$("#produto_nome").val('').trigger('change')
$("#produto_qtd").val('')
calcularTotalVenda()

}

function removerItemVenda(indice, elemento){
    window.itensVenda.splice(indice, 1)
    $(elemento).parent().parent().remove()
    calcularTotalVenda()
}

function selecionarCliente() {
    var comprador = window.clientesVendas[$("#nome").val()]
    $("#cpf").val(comprador.cpf).prop('disabled', true)
    $("#data_nascimento").val(comprador.data_nascimento).prop('disabled', true)
    $("#celular").val(comprador.celular).prop('disabled', true)
    $("#email").val(comprador.email).prop('disabled', true)
    $("#cep").val(comprador.cep).prop('disabled', true)
    $("#logradouro").val(comprador.logradouro).prop('disabled', true)
    $("#numero").val(comprador.numero).prop('disabled', true)
    $("#complemento").val(comprador.complemento).prop('disabled', true)
    $("#bairro").val(comprador.bairro).prop('disabled', true)
    $("#cidade").val(comprador.cidade).prop('disabled', true)
    $("#estado").val(comprador.estado).prop('disabled', true)

}


function calcularTotalVenda(){
    $('#valor-total-venda').html('')
    $('#valor-total-liquido').html('')

    var  valorTotalVenda = 0
    var  valorTotalCompra = 0
    $.each(window.itensVenda, function(indice, produto){
        valorTotalVenda += this.qtd * produto.dados.preco_venda 
        valorTotalVenda += produto.qtd * produto.dados.preco_compra
        $("#itens-venda").append(`
        <tr>
            <td><i class="fa fa-trash" onclick="removerItemVenda(${indice}, this)"></i></td>
            <td>${produto.qtd}</td>
            <td>${produto.dados.nome}</td>
            <td>${(produto.qtd * produto.dados.preco_venda).toLocaleString('pt-br', {minimumFractionDigits: 2})}</td>
            <td>${(produto.qtd * produto.dados.preco_compra).toLocaleString('pt-br', {minimumFractionDigits: 2})}</td>

        </tr>    
        `)
    })

    $('#valor-total-venda').html(`<b>Valor total bruto</b> R$ ${valorTotalVenda.toLocaleString('pt-br', {minimumFractionDigits: 2})}`)
    $('#valor-total-liquido').html(`<b>Valor total liquido</b> R$ ${(valorTotalVenda - valorTotalCompra).toLocaleString('pt-br', {minimumFractionDigits: 2})}`)
}

