window.produtoId = null
$('.mascara_dinheiro').mask('000.000.000.000.000,00', {reverse: true});
function buscarProdutos(){
    firebase.firestore()
    .collection('produtos')
    .where("deletado","==",false)
    .get()
    .then(function(produtos){
        $.each(produtos.docs, function(){
            var prod = this
            adicionarProdutosNaTabela(prod)
        })
        $('#tabela_produtos').DataTable({
            "language": {
                "url": "https://cdn.datatables.net/plug-ins/1.11.3/i18n/pt_br.json"
            }
        })
    })

  }

function adicionarProdutosNaTabela(prod){
     $('#lista_produtos').append(`
     <tr>
        <td>${prod.id}</td>
        <td>${prod.data().nome}</td>
        <td>${prod.data().preco_venda.toLocaleString('pt-br', {minimumFractionDigits: 2})}</td>
        <td>${prod.data().preco_compra.toLocaleString('pt-br', {minimumFractionDigits: 2})}</td>
        <td>
          <i onclick="editarProduto('${prod.id}')" class="fas fa-edit"></i>
          <i onclick="excluirProduto('${prod.id}')" style="margin-left:10px" class="fas fa-trash"></i>
        </td>
   
    </tr>
     `)
 }



 function novoProduto(){
    $(".btn_apaga_foto").parent().find('input').val('')
    $(".btn_apaga_foto").parent().find('img').attr('src', '../assets/img/sem_foto.png')
    $("#modal_produto").modal("show")
    $('#modal_produto').find("input").val('')
    $('#modal_produto').find("textarea").val('')
     window.produtoId = null
 }

 function salvarProduto(){
     if($("#produto_nome").val() == ""){
         new Swal("Atenção", 'por favor preencha o campo "Nome Produto" para prosseguir!', "error") 
         return
     }
     if($("#produto_marca").val() == ""){
        new Swal("Atenção", 'por favor preencha o campo "marca" para prosseguir!', "error") 
        return
    }
    if($("#produto_descricao").val() == ""){
        new Swal("Atenção", 'por favor preencha o campo "Descrição" para prosseguir!', "error") 
        return
    }
    if($("#produto_categorias").val() == ""){
        new Swal("Atenção", 'por favor preencha o campo "Categorias" para prosseguir!', "error") 
        return
    }
    if($("#produto_url").val() == ""){
        new Swal("Atenção", 'por favor preencha o campo "Url Pagamento" para prosseguir!', "error") 
        return
    }
    if($("#produto_preco_venda").val() == ""){
        new Swal("Atenção", 'por favor preencha o campo "Preço Venda" para prosseguir!', "error") 
        return
    }
    if($('#produto_desconto').val() == ""){
        new Swal("Atenção",'por favor preencha o campo "Desconto" para proseguir!', "error")
        return
    }
    if($("#produto_qtd_estoque").val() == ""){
        new Swal("Atenção", 'por favor preencha o campo "QTD. Estoque" para prosseguir!', "error") 
        return
    }
    if(window.produtoId == null && $("#produto_foto_destaque").val() == ""){
        new Swal("Atenção", 'por favor preencha o campo "Foto/banner de destaque" para prosseguir!', "error") 
        return
    }
   
    var precoVenda = $("#produto_preco_venda").val().replace(/\./g,'').replace(',', '.')
    var precoCompra = $("#produto_preco_compra").val().replace(/\./g,'').replace(',', '.')

     var objProduto = {
         nome : $("#produto_nome").val(),
         marca :  $("#produto_marca").val(),
         url_pagamento : $("#produto_url").val(),
         descricao :  $("#produto_descricao").val(),
         categorias: $("#produto_categorias").val().split(";"),
         preco_venda : parseFloat($("#produto_preco_venda").val()),
         preco_compra :  parseFloat($("#produto_preco_compra").val()),
         desconto:parseInt($("#produto_desconto").val()),
         qtd_estoque : $("#produto_qtd_estoque").val(),
         deletado: false,
         ultima_alteracao: new Date()
    }

    var listaFotos = []

    $('[type="file"]').each(function(){
        if($(this).val() !=""){
            listaFotos.push($(this).attr('id'))
        }else{
            if($(this).parent().find('img').attr('src') == '../assets/img/remover_foto.png'){
                var caminhoFoto = $(this).attr('id').replace('produto_', '')
                objProduto[caminhoFoto] = null
            }
        }
    })



    if(listaFotos.length > 0){
        gravaFotoRecursiva(objProduto, listaFotos, 0)
    }else{
        gravarProduto(objProduto)
    }

}


function removerFoto(elemento){
    $(elemento).parent().find('img').attr('src', '../assets/img/remover_foto.png')
    $(elemento).parent().find('input').val('')
}

function gravaFotoRecursiva(objProduto, listaFotos, indiceFoto){
    $("#load").show()
    $("#modal_produto").modal("hide")
    var minhaFoto = $("#"+listaFotos[indiceFoto]).parent().find('img').attr('src')
    var nomeFoto = document.getElementById(listaFotos[indiceFoto]).files[0].name
    var horaAtual = new Date().getTime()
    nomeFoto = horaAtual + nomeFoto
    var servicoStorage = firebase.storage().ref()
    .child("fotos_produtos/"+nomeFoto)

    
  
    servicoStorage.putString(minhaFoto, 'data_url').then(function(){
        servicoStorage.getDownloadURL().then(function(urlFoto){
            var caminhoFoto = listaFotos[indiceFoto].replace('produto_', '')
            objProduto[caminhoFoto] = urlFoto
            if(indiceFoto < (listaFotos.length - 1 )){
                gravaFotoRecursiva(objProduto, listaFotos, (indiceFoto + 1))
            }else{
                gravarProduto(objProduto) 
            }
           
        });
    })
 
}



function gravarProduto(objProduto){
    if (window.produtoId != null){
        firebase.firestore()
        .collection("produtos")
        .doc(window.produtoId)
        .set(objProduto, {merge: true})
        .then(function(resultado){
            new Swal({
                title: "Pronto",
                icon: "success",
                text: "Produto cadastrado com sucesso",
                buttonsStyling: false,
                confirmButtonText: "ok! Cadastrado.",
                customClass: {
                    confirmButton: "btn_swal"
                },
            
            }).then(function(){
                location.reload()
            })
        })
    }else{
        objProduto.cadastrado_em = new Date()
        firebase.firestore().collection("produtos").add(objProduto).then(function(resultado){
            firebase.firestore().collection('email').get().then(function(res){
                var listaDeEmail = [] 
                $.each(res.docs, function(){
                    listaDeEmail.push(this.data().email)
                })
                dispararEmail(listaDeEmail, 0, objProduto.nome, objProduto.foto_destaque, resultado.id)
            })
           
        })
    }


}

function editarProduto(idProduto){
   window.produtoId = idProduto
   firebase.firestore()
   .collection('produtos')
   .doc(idProduto)
   .get()
   .then(function(produto){
       if(produto.data().categorias){
           var categ = produto.data().categorias.join(";")
       }else{
           var categ = ""
       }
       $('.carregar_imagem').attr('src', '../assets/img/sem_foto.png')
        if(produto.data().foto_destaque){
            $("#produto_foto_destaque").parent().find('img').attr('src', produto.data().foto_destaque)
        }
        if(produto.data().foto_1){
            $("#produto_foto_1").parent().find('img').attr('src', produto.data().foto_1)
        }
        if(produto.data().foto_2){
            $("#produto_foto_2").parent().find('img').attr('src', produto.data().foto_2)
        }
        if(produto.data().foto_3){
            $("#produto_foto_3").parent().find('img').attr('src', produto.data().foto_3)
        }
        if(produto.data().foto_4){
            $("#produto_foto_4").parent().find('img').attr('src', produto.data().foto_4)
        }
        if(produto.data().foto_5){
            $("#produto_foto_5").parent().find('img').attr('src', produto.data().foto_5)
        }

      $("#produto_nome").val(produto.data().nome)
      $("#produto_marca").val(produto.data().marca),
      $("#produto_descricao").val(produto.data().descricao),
      $("#produto_categorias").val(categ),
      $("#produto_preco_venda").val(produto.data().preco_venda.toLocaleString('pt-br', {minimumFractionDigits: 2}))
      $("#produto_preco_compra").val(produto.data().preco_compra.toLocaleString('pt-br', {minimumFractionDigits: 2}))
      $("#produto_desconto").val(produto.data().desconto)
      $("#produto_qtd_estoque").val(produto.data().qtd_estoque)  
      $("#produto_url").val(produto.data().url_pagamento)
      $("#modal_produto").modal('show')

       })
   
}


function excluirProduto(idProduto){
     Swal.fire({
        title: "Atenção",
        text: "Realmente deseja excluir este produto?",
        icon: "question",
        showCancelButton:true,
        confirmButtonText: "Sim, desejo remover.",
        cancelButtontext: "Cancelar",
        reversebuttons: true,
        
    }).then(function(result) {
        if (result.value) {
            var objProduto = {
                deletado: true
            }
            firebase.firestore()
            .collection("produtos")
            .doc(idProduto)
            .set(objProduto, {merge: true})
            .then(function(resultado){
                new Swal({
                    title: "Pronto",
                    icon: "success",
                    text: "Produto deletado com sucesso.",
                    buttonsStyling: false,
                    confirmButtonText: "ok! Deletado.",
                    customClass: {
                        confirmButton: "btn_swal"
                    },
                    
                }).then(function(){
                    location.reload()
                })
            })

        }
    });
}

$(document).ready(function(){
    firebase.auth().onAuthStateChanged(function(usuarioLogado){
      if(usuarioLogado){
        $("#navbarDropdownMenuLink").html(usuarioLogado.email)
       buscarProdutos()
       $("#load").hide()
      }else{
          location.href = "https://sunshine-moda-praia.web.app/area-restrita/login.html"
      }
    })
  

 
  $('[type="file"]').on('change',function(){
    if($(this).val() !=""){
        var idImagem = $(this).attr('id')
        var leitorDeArquivo = new FileReader()
        var imagem = document.getElementById(idImagem).files[0]
        leitorDeArquivo.onloadend = function(){
            $("#"+idImagem).parent().find('img').attr('src', leitorDeArquivo.result)
        }
        leitorDeArquivo.readAsDataURL(imagem)
    }
})
})

function dispararEmail(lista, indice , nome, foto, cod){
    var html = `
    



    <div class="es-wrapper-color">
        <!--[if gte mso 9]>
            <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                <v:fill type="tile" color="#fafafa"></v:fill>
            </v:background>
        <![endif]-->
        <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
            <tbody>
                <tr>
                    <td class="esd-email-paddings" valign="top">
                        <table cellpadding="0" cellspacing="0" class="es-content esd-header-popover" align="center">
                            <tbody>
                                <tr>
                                    <td class="esd-stripe" align="center" esd-custom-block-id="388982">
                                        <table class="es-content-body" align="center" cellpadding="0" cellspacing="0" width="600" style="background-color: transparent;" bgcolor="rgba(0, 0, 0, 0)">
                                            <tbody>
                                                <tr>
                                                    <td class="esd-structure es-p20" align="left">
                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td width="560" class="esd-container-frame" align="center" valign="top">
                                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td align="center" class="esd-block-text es-infoblock">
                                                                                        <p><a target="_blank"></a></p>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <br>
                        <br>
                        <table cellpadding="0" cellspacing="0" class="es-header" align="center">
                            <tbody>
                                <tr>
                                    <td class="esd-stripe" align="center" esd-custom-block-id="388981">
                                        <table bgcolor="#ffffff" class="es-header-body" align="center" cellpadding="0" cellspacing="0" width="600">
                                            <tbody>
                                                <tr>
                                                    <td class="esd-structure es-p10t es-p10b es-p20r es-p20l" align="left">
                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td width="560" class="es-m-p0r esd-container-frame" valign="top" align="center">
                                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td align="center" class="esd-block-image es-p20b" style="font-size: 0px;"><a target="_blank"><img src="https://sunshine-moda-praia.web.app/assets/img/logo%20com%20biqui1.png" alt="Logo" style="display: block; font-size: 12px;" width="200" title="Logo"></a></td>
                                                                                </tr>
                                                                               
                                                                                <tr>
                                                                                    
                                                                                    <td class="esd-block-menu" esd-tmp-menu-padding="15|15">
                                                                                        <table cellpadding="0" cellspacing="0" width="100%" class="es-menu">
                                                                                           
                                                                                        </table>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <br>
                        <br>
                        <table cellpadding="0" cellspacing="0" class="es-content" align="center">
                            <tbody>
                                <tr>
                                    <td class="esd-stripe" align="center">
                                        <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff;">
                                            <tbody>
                                                <tr>
                                                    <td class="esd-structure es-p20t es-p20r es-p20l" align="left">
                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td width="560" class="esd-container-frame" align="center" valign="top">
                                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td align="center" class="esd-block-text es-p5t es-p5b es-m-txt-c">
                                                                                        <h1 style=" color: #8F7E7E; font-size: 25px; ">Um novo  produto foi cadastrado!<br>
                                                                                            <br>
                                                                                        " ${nome} " </h1>
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                  
                                                                                    <td align="center" class="esd-block-image es-p10t es-p10b" style="font-size: 0px;"><a target="_blank"><img class="adapt-img" src="${foto}" alt style="display: block; border-radius: 10px;" width="350"></a></td>
                                                                                </tr>
                                                                               
                                                                                <tr>
                                                                                    
                                                                                    <td align="center" class="esd-block-text es-p10t es-m-txt-c"> <br> <br> <br>
                                                                                        <a href="https://sunshine-moda-praia.web.app/produto.html?cod=${cod} " style=" font-size: 20px; background: #FAEAEA; color: #8F7E7E; text-transform: uppercase; text-transform: uppercase; border: 2px solid #d3c1c1; padding: 10px; border-radius: 5px;">
                                                                                            ver produto
                                                                                        </a>
                                                                                  <br>  <br>   <br> <br><br><h2 style=" color: #8F7E7E; "> Confira as novidades da nossa loja, <br>
                                                                                            Temos as melhores opções para as modas praia e fitness.</h2> <br> <br> <br>
                                                                                    </td>
                                                                                   
                                                                                </tr> 
                                                                                
                                                                
                                                                            </tbody>
                                                                            <br>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                               
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    
                                                    <td class="esd-structure es-p10b es-p20r es-p20l" align="left">
                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td width="560" class="esd-container-frame" align="center" valign="top">
                                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td align="center" class="esd-block-button es-p15t es-p10b"><span class="es-button-border" style="border-width: 2px; border-color: #5c68e2; background: #5c68e2;"><a href class="es-button es-button-1621341519989" target="_blank" style="border-width: 10px 30px;"></a></span></td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                
                                                    <td class="esd-structure es-p20" align="left">
                                                        <!--[if mso]><table width="560" cellpadding="0" cellspacing="0"><tr><td width="265" valign="top"><![endif]-->
                                                        <table cellpadding="0" cellspacing="0" align="left" class="es-left">
                                                            <tbody>
                                                                <tr>
                                                                    <td width="265" class="esd-container-frame" align="center" valign="top">
                                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td align="center" class="esd-block-image" style="font-size: 0px;"><a target="_blank"><img class="adapt-img" src="https://firebasestorage.googleapis.com/v0/b/sunshine-moda-praia.appspot.com/o/fotos_produtos%2Ffunction%20getTime()%20%7B%20%5Bnative%20code%5D%20%7D1.jpg?alt=media&token=5de977c7-7746-4f18-a3ad-b8d5143e676e" alt style="display: block; border-radius: 10px;" width="265"></a></td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                   
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <!--[if mso]></td><td width="30"></td><td width="265" valign="top"><![endif]-->
                                                        <table cellpadding="0" cellspacing="0" class="es-right" align="right">
                                                            <tbody>
                                                                <tr>
                                                                    <td width="265" align="left" class="esd-container-frame">
                                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td align="center" class="esd-block-image" style="font-size: 0px;"><a target="_blank"><img class="adapt-img" src="https://firebasestorage.googleapis.com/v0/b/sunshine-moda-praia.appspot.com/o/fotos_produtos%2Ffunction%20getTime()%20%7B%20%5Bnative%20code%5D%20%7D5maio.jpg?alt=media&token=ec939c4d-e46a-4cca-9fc3-484dacbbde62" alt style="display: block; border-radius: 10px;" width="265"></a></td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <!--[if mso]></td></tr></table><![endif]-->
                                                    </td>
                                                </tr>
                                                <tr>
                                                   
                                 
                        <table cellpadding="0" cellspacing="0" class="es-footer" align="center">
                            <tbody>
                                <tr>
                                    <td class="esd-stripe" align="center" esd-custom-block-id="388980">
                                        <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0" width="640" style="background-color: transparent;">
                                            <tbody>
                                                <tr>
                                                    <td class="esd-structure es-p20t es-p20b es-p20r es-p20l" align="left">
                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td width="600" class="esd-container-frame" align="left">
                                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <div style="text-align: center;">
                                                                                     <a href="https://sunshine-moda-praia.web.app/"  style=" font-size: 20px; background: #FAEAEA; color: #8F7E7E; text-transform: uppercase; text-transform: uppercase; border: 2px solid #d3c1c1; padding: 10px; border-radius: 5px;">Ir para a loja</a>
    
                                                                                    </div>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <br>
                                                                                    <td align="center" class="esd-block-social es-p15t es-p15b" style="font-size:0">
                                                                                        <table cellpadding="0" cellspacing="0" class="es-table-not-adapt es-social">
                                                                                            <tbody>
                                                                                                
                                                                                                    
                                                                                                     
                                                                                                <tr>
                                                                                                  
                                                                                                    
                                                                                                   <td align="center" valign="top" class="es-p40r"><a target="_blank" href="https://www.instagram.com/sunshine_modapraiaa/"><img title="Instagram" src="https://ticvdv.stripocdn.email/content/assets/img/social-icons/logo-black/instagram-logo-black.png" alt="Inst" width="62"></a></td>
                                                                                                    
                                                                                                </tr> <br>
                                                                                                
                                                                                            
                                                                                            </tbody>
                                                                                            
                                                                                        </table>
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                  
                                                                                    <td align="center" class="esd-block-text es-p35b"> <br> <p style="font-size: 20px; color:#8F7E7E ;"> Siga-nos no instagram.</p> <br> <br> <br>
                                                                                        <p style=" color: #8F7E7E; font-size: 18px;">Todos os direitos reservados @2021! Sunshine</p> <br> <br>
                                                                                        
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td class="esd-block-menu" esd-tmp-menu-padding="5|5" esd-tmp-divider="1|solid|#cccccc" esd-tmp-menu-color="#999999">
                                                                                        <table cellpadding="0" cellspacing="0" width="100%" class="es-menu">
                                                                                            <tbody>
                                                                                                
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table cellpadding="0" cellspacing="0" class="es-content esd-footer-popover" align="center">
                            <tbody>
                                <tr>
                                    <td class="esd-stripe" align="center" esd-custom-block-id="388983">
                                        <table class="es-content-body" align="center" cellpadding="0" cellspacing="0" width="600" style="background-color: transparent;" bgcolor="rgba(0, 0, 0, 0)">
                                            <tbody>
                                                <tr>
                                                    <td class="esd-structure es-p20" align="left">
                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td width="560" class="esd-container-frame" align="center" valign="top">
                                                                        <table cellpadding="0" cellspacing="0" width="100%">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td align="center" class="esd-block-text es-infoblock">
                                                                                        <p style=" color: #8F7E7E; font-size: 18px;"><a target="_blank"></a>Não deseja mais receber esses e-mails? <br> Cancelar subscrição?&nbsp;<a style=" color: #8F7E7E; font-size: 18px;"href="https://sunshine-moda-praia.web.app/contato.html" target="_blank">Cancelar subscrição</a>.<a target="_blank"></a></p>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>   
    `
    var email = { 
    to: lista[indice],
    message: {
      subject: 'Oba , produto novo!',
      text: '',
      html: ' <code>'+html+'</code> ',
    }
}

    firebase.firestore().collection('mail').add(email).then(function(){
        if(indice < lista.length  - 1){
            dispararEmail(lista, (indice + 1) , nome, foto, cod)
        }else{
            new Swal({
                title: "Pronto!",
                icon:"success",
                Text: "Produto cadastrado com sucesso.",
                buttonsStyling: false,
                confirmButtonText: "Cadastrado!",
                customClass: {
                    confirmButton: "btn_swal"
                },
            
            }).then(function(){
               location.reload()
            })
        }
    })
}






