$(document).ready(function () {
    $('#celular-login').mask('(99) 99999-9999')
    $('#celular').mask('(99) 99999-9999')
    $('#validityCard').mask('99/99')
    window.captchaDeSegurança = new firebase.auth.RecaptchaVerifier(
      'enviar-codigo',
      {
        size: 'invisible',
        callback: (response) => {},
      },
    )
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        window.usuarioLogado = user
        logadoComSucesso()
        if(location.pathname == "/minhasCompras.html") {
            minhasCompras()
            
        }
      } else {
        $('#btn-login').show()
        $('.btn-logado').hide()
        
      }
    })
    $('#cep').on('change', function () {
      var cep = $('#cep').val().replace('-', '')
      var urlApiTerceiro = 'https://viacep.com.br/ws/' + cep + '/json/?callback='
      $.getJSON(urlApiTerceiro, function (resultado) {
        if (!('erro' in resultado)) {
          $('#logradouro').val(resultado.logradouro).prop('disabled', true)
          $('#bairro').val(resultado.bairro).prop('disabled', true)
          $('#cidade').val(resultado.localidade).prop('disabled', true)
          $('#estado').val(resultado.uf).prop('disabled', true)
        } else {
          new Swal(
            'OPS!',
            'Não foi  possível buscar este CEP, verifique-o e tente novamente.',
          )
        }
      })
    })
    
    $('#cpfCard').mask('999.999.999-99')
    $('#cpf').mask('999.999.999-99')
    $('#celular').mask('(99) 99999-9999')
    $('#cep').mask('99999-999')
    $('#numberCard').mask('9999 9999 9999 9999')
    $('#validityCard').mask('99/99')
  
  
  })

  function signOut(){
    firebase.auth().signOut()
    location.reload()
    
  }

  

  function buscarCEP() {
    var cep = $('#cep').val().replace('-', '')
    var urlApiTerceiro = 'https://viacep.com.br/ws/' + cep + '/json/?callback='
    $.getJSON(urlApiTerceiro, function (resultado) {
      if (!('erro' in resultado)) {
        $('#logradouro').val(resultado.logradouro).prop('disabled', true)
        $('#bairro').val(resultado.bairro).prop('disabled', true)
        $('#cidade').val(resultado.localidade).prop('disabled', true)
        $('#estado').val(resultado.uf).prop('disabled', true)
      } else {
        new Swal(
          'OPS!',
          'Não foi  possível buscar este CEP, verifique-o e tente novamente.',
        )
      }
    })
  }
  function salvarDestinatario() {
    var carrinho = localStorage.getItem('carrinho')
    if (!carrinho) {
      var carrinho = {
        itens: [],
      }
    } else {
      carrinho = JSON.parse(carrinho)
    }
    if (carrinho.itens.length == 0) {
      new Swal(
        'Atenção',
        'Selecione ao menos um produto para prosseguir',
        'error',
      )
      return
    }
    var camposObrigatorios = 0
    $('.obrigatorio').each(function () {
      if ($(this).val() == '') {
        camposObrigatorios += 1
        console.log($(this).attr('id'))
      }
    })
    if (camposObrigatorios > 0) {
      new Swal(
        'Atenção',
        'Por favor preencha todos os campos com "*" para prosseguir!',
        'error',
      )
      return
    }
    var destinatario = {
      nome: $('#nome').val(),
      cpf: $('#cpf').val(),
      data_nascimento: $('#data_nascimento').val(),
      celular: $('#celular').val(),
      email: $('#email').val(),
      cep: $('#cep').val(),
      logradouro: $('#logradouro').val(),
      numero: $('#numero').val(),
      complemento: $('#complemento').val(),
      bairro: $('#bairro').val(),
      cidade: $('#cidade').val(),
      estado: $('#estado').val(),
    }
    var venda = {
      destinatario: destinatario,
      itens: carrinho.itens,
      comprador: window.usuarioLogado.uid,
      data_venda: new Date(),
    }
    if (localStorage.getItem('idVendaAtual')) {
      firebase
        .firestore()
        .collection('vendas')
        .doc(window.idVendaAtual)
        .set(venda, { merge: true })
        .then(function () {
          sucessoVenda(idVendaAtual)
        })
    } else {
      firebase
        .firestore()
        .collection('vendas')
        .add(venda)
        .then(function (venda) {
          window.idVendaAtual = venda.id
          localStorage.setItem('idVendaAtual', idVendaAtual)
          sucessoVenda(venda.id)
        })
    }
  }
  function sucessoVenda(id) {
    new Swal({
      title: 'Pronto!',
      icon: 'success',
      confirmButtonText: 'Realizar Pagamento',
      html: `Seu pedido foi gerado com o seguinte código: <br>
      <b>${id}</b></br>
      clique no botão abaixo 'Realizar Pagamento ' para prosseguir com o pagamento`,
    }).then(function () {
      getTokenSessao()
      $('.compra_modal').hide()
      $('#compra_pagamento').show()
      $('.btn-etapa').hide()
      $('.btn-etapa-3').show()
      $('.etapas').removeClass('etapa-ativa')
      $('.etapa-3').addClass('etapa-ativa')
    })
  }
  function realizarPagamento() {
    var error = 0
    if ($('#numberCard').val() == '') {
      error += 1
    }
    if ($('#validityCard').val() == '') {
      error += 1
    }
    if ($('#codeCard').val() == '') {
      error += 1
    }
    if ($('#nameCard').val() == '') {
      error += 1
    }
    if ($('#cpfCard').val() == '') {
      error += 1
    }
    if (error > 0) {
      new Swal(
        'Atenção',
        'Por favor preencha todos os campos com "*" para prosseguir!',
        'error',
      )
      return
      }
      if ($('#nameCard').val().split(" ").length < 2) {
        new Swal(
          'Atenção',
          'Por favor verifique o nome que está no cartão de crédito! E tente novamente',
          'error',
        )
        return
    
  
  
    }
    $('.compra_modal').hide()
    $('#Processando_Pagamento').show()
    $('.btn-etapa').hide()
    $('.btn-etapa-4').show()
    $('.etapas').removeClass('etapa-ativa')
    $('.etapa-4').addClass('etapa-ativa')
    solicitarPagamento()
  }
  function recuperarCarrinho() {
    var carrinho = localStorage.getItem('carrinho')
    if (!carrinho) {
      var carrinho = {
        itens: [],
      }
    } else {
      carrinho = JSON.parse(carrinho)
    }
    listaItensCarrinho(carrinho)
  }
  function listaItensCarrinho(carrinho) {
    if (
      localStorage.getItem('idVendaAtual') && location.pathname == '/carrinho.html'
    ) {
      new Swal({
        title: 'Atenção!',
        text:"Existe uma venda em aberto, deseja finalizar a venda ou encerrar o processo?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#dfb331',
        confirmButtonText: 'Continuar a Compra',
        cancelButtonText: 'Cancelar a Compra',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
            window.idVendaAtual = localStorage.getItem('idVendaAtual')
          continuarCompra(carrinho)
        } else {
          cancelarCompra(carrinho)
        }
      })
    } else {
      continuarCompra(carrinho)
    }
  }
  function continuarCompra(carrinho) {
    var total = 0
    var itens = 0
    $('#itens-carrinho').html('')
    $.each(carrinho.itens, function (i, v) {
      JSON.parse(localStorage.carrinho)
      itens += v.qtd
      total += v.dados.preco_venda * v.qtd
      $('#itens-carrinho').append(`
      <div class="col-md-2">
         <img id="fts" style="width: 100%; height:20vh" src="${ v.dados.foto_destaque}" alt="">
      </div>
      <div  style=font-size: 22px;"  class="item-${i} col-md-10"> 
         Item: <b> ${v.dados.nome}</b><br>
         Quantidade: <b  style="color: #F27649;">${v.qtd} Unidades</b><br>
         <span style="color: #F27649;">Total : </span>  R$ ${(
           v.dados.preco_venda * v.qtd
         ).toLocaleString('pt-br', {
           minimumFractionDigits: 2,
           maximumFractionDigits: 2,
         })} <br>
         <br>
         <button onclick="removerItem(${i})" class="btn btn-danger" >Remover Item</button>
      </div>
      <div  class="item-${i} col-md-12">
         <hr>
      </div>
      `)
    })
    $('#valor-total').html(
      ' R$ ' +
        total.toLocaleString('pt-br', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    )
    $('.qtd-carrinho').html(itens)
  }
  function cancelarCompra() {
    var obj = {
      status: 'Compra Cancelada',
    }
    firebase
      .firestore()
      .collection('vendas')
      .doc(localStorage.getItem('idVendaAtual'))
      .set(obj, { merge: true })
      .then(function () {
        new Swal('Pronto!', 'Venda Cancelada', 'success')
        localStorage.clear()
      })
  }
  function removerItem(indice) {
    var carrinho = JSON.parse(localStorage.getItem('carrinho'))
    carrinho.itens.splice(indice, 1)
    localStorage.setItem('carrinho', JSON.stringify(carrinho))
    listaItensCarrinho(carrinho)
  }
  
  function enviarCodigoCelular() {
    var nome = $('#nome-login').val()
    var celular = $('#celular-login').val()
    if (nome == '' || celular == '') {
      new Swal(
        'Atenção',
        'Por favor preencha todos os campos com "*" para prosseguir!',
        'error',
      )
      return
    }
    const validacaoCaptcha = window.captchaDeSegurança
    firebase
      .auth()
      .signInWithPhoneNumber('+55' + celular.replace(/\D/g, ''), validacaoCaptcha)
      .then((resultadoConfirmado) => {
        new Swal(
          'Pronto',
          'Enviamos um SMS de confirmação para o seu ceular',
          'success',
        )
        window.resultadoConfirmado = resultadoConfirmado
        $('.btn-etapa').hide()
        $('.btn-etapa-1').show()
        $('#codigo-login').prop('disabled', false)
      })
      .catch((error) => {
        console.log(error)
        new Swal('Atenção ', ' Não foi possivel enviar o SMS!', 'error')
      })
  }

  function validarCodigo() {
    var codigo = $('#codigo-login').val()
    if (codigo == '') {
      new Swal(
        'Atenção',
        'Por favor preencha o código recebido por SMS para prosseguir!',
        'error',
      )
    }
    resultadoConfirmado
      .confirm(codigo)
      .then((result) => {
        console.log(result.uid)
        const usuario = result.user
        if (location.pathname != '/carrinho.html') {
          var dadosLogin = {
            celular: $('#celular-login').val(),
          }
        } else {
          var dadosLogin = {
            nome: $('#nome-login').val(),
            celular: $('#celular-login').val(),
          }
        }
        firebase
          .firestore()
          .collection('login')
          .doc(usuario.uid)
          .set(dadosLogin, { merge: true })
          .then(() => {})
      })
      .catch((error) => {
        console.log(error)
        new Swal(
          'Atenção',
          'Não foi possivel fazer login, verifique o código e tente novamente!',
          'error',
        )
      })
  }
  function logadoComSucesso() {
    firebase
      .firestore()
      .collection('login')
      .doc(window.usuarioLogado.uid)
      .get()
      .then((dadosCliente) => {
        if (dadosCliente.exists && dadosCliente.data().nome) {
          $('#nome').val(dadosCliente.data().nome ? dadosCliente.data().nome : '')
          $('#cpf').val(dadosCliente.data().cpf ? dadosCliente.data().cpf : '')
          $('#data_nascimento').val(
            dadosCliente.data().data_nascimento
              ? dadosCliente.data().data_nascimento
              : '',
          )
          $('#celular').val(
            dadosCliente.data().celular ? dadosCliente.data().celular : '',
          )
          $('#email').val(
            dadosCliente.data().email ? dadosCliente.data().email : '',
          )
          $('#email_oferta').val(
            dadosCliente.data().email ? dadosCliente.data().email : '',
          )
          $('#cep').val(dadosCliente.data().cep ? dadosCliente.data().cep : '')
          $('#logradouro').val(
            dadosCliente.data().logradouro ? dadosCliente.data().logradouro : '',
          )
          $('#numero').val(
            dadosCliente.data().numero ? dadosCliente.data().numero : '',
          )
          $('#complemento').val(
            dadosCliente.data().complemento
              ? dadosCliente.data().complemento
              : '',
          )
          $('#bairro').val(
            dadosCliente.data().bairro ? dadosCliente.data().bairro : '',
          )
          $('#cidade').val(
            dadosCliente.data().cidade ? dadosCliente.data().cidade : '',
          )
          $('#estado').val(
            dadosCliente.data().estado ? dadosCliente.data().estado : '',
          )
          $('#btn-login').hide()
          $('.btn-logado').show()
          $('#exampleModal').modal('hide')
          $('#bem_vindo').html('Bem vindo ' + dadosCliente.data().nome)
        } else {
          $('#modal_cadastro').modal('show')
          new Swal('ops!', 'Faça o seu Cadastro.', 'error')
          $('#btn-login').hide()
          $('.btn-logado').show()
        }
      })
    if (location.pathname == '/carrinho.html') {
      
     
      $('.compra_modal').hide()
      $('#compra_dados_cadastrais').show()
      $('.btn-etapa').hide()
      $('.btn-etapa-2').show()
      $('.etapas').removeClass('etapa-ativa')
      $('.etapa-2').addClass('etapa-ativa')
    }
  }
  function tentarPagamentoNovamente(){
    new Swal({
      title: "Ops!",
      icon: "error",
      confirmButtonText: " Tentar Novamente",
      html: `Ocorreu um error ao tentar realizar o pagamento, verifique os dados informados e tente novamente.`
    }).then(function(){
      location.reload();
    })
  }
  function encerrarSessao() {
    firebase.auth().singOut()
  }
  function getTokenSessao() {
    var myHeaders = new Headers()
    var myInit = {
      method: 'GET',
      headers: myHeaders,
      mode: 'cors',
      cache: 'default',
    }
    fetch(
      'https://us-central1-sunshine-moda-praia.cloudfunctions.net/recuperaToken/',
      myInit,
    )
      .then(function (response) {
        return response.json()
      })
      .then(function (dados) {
  
        if(dados.error){
          tentarPagamentoNovamente()
          return
        }
        
        console.log('Token recuperando com sucesso.', dados)
        PagSeguroDirectPayment.setSessionId(dados.token)
        console.log('Token setado na sessao do pagseguro .')
        PagSeguroDirectPayment.getPaymentMethods({
          amount: 500.0,
          success: function (response) {
            console.log(' Meios de pagamento disponiveis', response)
            PagSeguroDirectPayment.onSenderHashReady(function (response) {
              if (response.status == 'error') {
                console.log(response.message)
                return false
              }
              console.log(response)
              window.hashComprador = response.senderHash
              console.log('Recuperado a hash do comprador')
            })
          },
          error: function (response) {
            console.error(response)
          },
          complete: function (response) {},
        })
      })
      .catch(function (error) {
        console.log(
          'There has benn a problem with your fetch operation: ' + error.message,
        )
      })
  }
  function getBandeiraCartao() {
    var numeroCartao = document.getElementById('numberCard').value
    PagSeguroDirectPayment.getBrand({
      cardBin: parseInt(numeroCartao.substr(0, 6)),
      success: function (response) {
        console.log('Bandeira encontrada', response)
        window.bandeiraCartao = response.brand.name
      },
      error: function (response) {
        console.log(error)
        tentarPagamentoNovamente()
      },
      complete: function (response) {},
    })
  }
  function getQtdParcelas() {
    PagSeguroDirectPayment.getInstallments({
      amount: 500.0,
      maxInstallmentNoInterest: 2,
      brand: 'visa',
      success: function (response) {
        console.log('Quantidade de parcelas', response)
      },
      error: function (response) {
        tentarPagamentoNovamente()
      },
      complete: function (response) {},
    })
  }
  function salvarCliente() {
    var camposObrigatorios = 0
    $('.obrigatorio').each(function () {
      if ($(this).val() == '') {
        camposObrigatorios += 1
      }
    })
    if (camposObrigatorios > 0) {
      new Swal(
        'Atenção',
        'Por favor preencha todas os campos com ' * ' para prosseguir!',
        'error',
      )
      return
    }
    var cliente = {
      nome: $('#nome').val(),
      cpf: $('#cpf').val(),
      data_nascimento: $('#data_nascimento').val(),
      celular: $('#celular').val(),
      email: $('#email').val(),
      cep: $('#cep').val(),
      logradouro: $('#logradouro').val(),
      numero: $('#numero').val(),
      complemento: $('#complemento').val(),
      bairro: $('#bairro').val(),
      cidade: $('#cidade').val(),
      estado: $('#estado').val(),
    }
    gravarCliente(cliente)
  }
  function gravarCliente(dadosCliente) {
    var gravacaoCliente = firebase.firestore().collection('login')
    gravacaoCliente
      .doc(window.usuarioLogado.uid)
      .set(dadosCliente, { merge: true })
      .then(function () {
        gravadoComSucesso()
      })
  }
  function gravadoComSucesso() {
    new Swal({
      title: 'Pronto!',
      icon: 'success',
      Text: 'Cliente salvo com sucesso.',
      buttonsStyling: false,
      confirmButtonText: 'ok! Cliente salvo com sucesso.',
      customClass: {
        confirmButton: 'btn',
      },
    }).then(function () {
      location.reload()
    })
  }
  function solicitarPagamento() {
    var numberCard = document.getElementById('numberCard').value.replace(/\s/g,'')
    var validityCard = document.getElementById('validityCard').value.split('/')
    var codeCard = document.getElementById('codeCard').value
    var nameCard = document.getElementById('nameCard').value
    var cpfCard = document.getElementById('cpfCard').value
    var dados = {
      destinatario: {
        cpf: cpfCard,
        nome_cartao: nameCard,
      },
    }
    firebase
      .firestore()
      .collection('vendas')
      .doc(window.idVendaAtual)
      .set(dados, { merge: true })
      .then(function () {
        PagSeguroDirectPayment.createCardToken({
          cardNumber: numberCard,
          brand: window.bandeiraCartao,
          cvv: codeCard,
          expirationMonth: validityCard[0],
          expirationYear: "20"+ validityCard[1],
          success: function (response) {
            firebase
              .firestore()
              .collection('vendas')
              .doc(window.idVendaAtual)
              .onSnapshot((venda) => {
                if (
                  venda.data().pagamento_confirmado &&
                  venda.data().status == 'Pagamento Aprovado'
                ) {
                  $('.compra_status').hide()
                  $('#pagamento_aprovado').show()
                  localStorage.clear()
                }
              })
            console.log('cartão criptografado', response)
            var dadosComprador = {
              senderHash: window.hashComprador,
              creditCardToken: response.card.token,
              itemId1: 3,
              reference: window.idVendaAtual,
            }
            fetch(
              'https://us-central1-sunshine-moda-praia.cloudfunctions.net/pagamentoCartaoCredito',
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json, text/plain, */*',
                  'Content-type': 'application/json',
                },
                body: JSON.stringify(dadosComprador),
              },
            )
              .then(function (res) {return res.json()})
              .then(function (data) {
                console.log('Deu certo', data)
                if(data.result && data.result.name && data.result.name == 'Error'){
                  tentarPagamentoNovamente()
                  return
                }
              })
              .catch(function(err){
                console.log(err)
                tentarPagamentoNovamente()
              })
              
          },
          complete: function (response) {
  
          },
        });
      })
  }
  recuperarCarrinho()
  