const axios = require('axios');
const { response } = require('express');
const urlAPI = `https://ws.sandbox.pagseguro.uol.com.br`; //URL de teste
//const urlAPI = `https://ws.pagseguro.uol.com.br`: //URL de PRODUÇÂO
const emailAPI = 'heberluiz18@hotmail.com'
const tokenAPI = 'C7126EBA604E45239B6599E5A0352FE8'
const parser = require('xml-js');
const db = require('./firebase.js');



const convert = require('xml-js');
//const xml = require('fs').readFileSync('./testscenario.xml', 'utf8');



class Pagseguro{
    recuperaToken(requisicao, resposta){
        axios({
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            url: urlAPI+`/v2/sessions?email=${emailAPI}&token=${tokenAPI}`,
        }).then(function(dados){
            var result = convert.xml2json(dados.data, {compact:true,spaces: 4})
             resposta.status(200).json({token: JSON.parse(result).session.id._text});
        }).catch(function(err){
            console.log(err)
            var obj = {
                error: true,
                msg: "Error ao buscar token",
                descr_error: err
            }
            resposta.status(500).json(obj)
        })
       
    }
    criandoSolicitacaoPagamentoCartaoCredito(requisicao, resposta) {
        console.log(requisicao.body)
        db.collection('vendas').doc(requisicao.body.reference).get().then(function(resultado){
            var valorTotalVenda = 0
            resultado.data().itens.forEach(produto => {
                valorTotalVenda += produto.qtd * produto.dados.preco_venda
            });
                var config = {
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded'
                    }
                }
                var destinatario = resultado.data().destinatario
                var dadosCompra = {}
                dadosCompra.receiverEmail = emailAPI //"email_vendedor"
                dadosCompra.currency = "BRL" //"BRL"
                dadosCompra.extraAmount = "0.00" //"0.00"
                dadosCompra.itemId1 =  requisicao.body.reference.qtd;
                dadosCompra.itemDescription1 = "COMPRA DE "+resultado.data().itens.length + " ITENS."; //"descricaoservicosemacento";
                dadosCompra.itemAmount1 = valorTotalVenda.toFixed(2) //"preco float em string"
                dadosCompra.itemQuantity1 = 1
                dadosCompra.notificationURL = "https://us-central1-sunshine-moda-praia.cloudfunctions.net/consultarStatusVenda"
                dadosCompra.reference = requisicao.body.reference //"referencia preferencialmente id"
                dadosCompra.senderName =  resultado.data().destinatario.nome.toUpperCase() //"nome solicitante"
                var docP =  resultado.data().destinatario.cpf //"documentoPessoa"
                // if (docP > 11) {
                //dadosCompra.senderCNPJ = docP.replace(/-/g, "").replace(/\./g, "")
                //} else {
                dadosCompra.senderCPF = docP.replace(/-/g, "").replace(/\./g, "")
                //}
                var celularCompleto = resultado.data().destinatario.celular.replace(/[^0-9.]/g, "")
                var dd =  celularCompleto.substring(0, 2)
                var celular = celularCompleto.substr(2, 9)
                
               
                dadosCompra.senderAreaCode = parseInt(dd) //"dd do comprador em inteiro"
                dadosCompra.senderPhone = parseInt(celular) //"celular do comprador em inteiro"
                dadosCompra.senderEmail = resultado.data().destinatario.email
                dadosCompra.senderHash = requisicao.body.senderHash // hash do pagamento
                dadosCompra.creditCardToken = requisicao.body.creditCardToken // hash do pagamento
                dadosCompra.shippingAddressRequired = false // endereco sim ou não
        
        
                dadosCompra.paymentMode = "default" //"default"
                dadosCompra.paymentMethod = "creditCard" //"creditcard"
        
                //if (sem parcelamento){
                    if (true) {
                        dadosCompra.installmentQuantity = 1
                        dadosCompra.installmentValue = valorTotalVenda.toFixed(2) //"preco float em string"
                    } else {
                        //dadosCompra.installmentQuantity = // quantidade de parcelas
                        // dadosCompra.installmentValue  = // valor das parcelas calculadas com jueros
                    }
        
                    dadosCompra.creditCardHolderName = resultado.data().destinatario.nome_cartao//"nome pagador"
                    dadosCompra.creditCardHolderCPF = docP.replace(/-/g, "").replace(/\./g, "") //"cpf".replace(/-/g, "")
                    dadosCompra.creditCardHolderBirthDate = "27/10/1987" //"27/10/1987"
                    dadosCompra.creditCardHolderAreaCode = dd
                    dadosCompra.creditCardHolderPhone = celular
                    dadosCompra.billingAddressStreet =  destinatario.logradouro.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
                    dadosCompra.billingAddressNumber = 0
                    dadosCompra.billingAddressComplement = destinatario.complemento.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
                    dadosCompra.billingAddressDistrict = destinatario.bairro.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
                    dadosCompra.billingAddressPostalCode =  parseInt(destinatario.cep.replace(/[^0-9.]/g, ""))
                    dadosCompra.billingAddressCity =  destinatario.cidade.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
                    dadosCompra.billingAddressState = destinatario.estado.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
                    dadosCompra.billingAddressCountry = "BRA"
                    axios
                        .post(
                            `${urlAPI}/v2/transactions?email=${emailAPI}&token=${tokenAPI} `,
                            new URLSearchParams(dadosCompra).toString(),
                            config)
                        .then((res) => {
                            if (res.status == 200) {
                                var xml = res.data;
                                var result = parser.xml2json(xml, {
                                    compact: true,
                                    spaces:0
                                });
                                resposta.status(200).send({
                                    status: true,
                                    result: result
                                })
                            } else {
                                console.log("erro no resposta")
                                console.log(JSON.stringify(res))
                                resposta.status(502).send({
                                    status: false,
                                    result: null
                                })
        
                                return
                            }
                        })   
        
                        .catch((error) => {
                            console.log(error)
                            resposta.status(503).send({
                                status: false,
                                result: "Error ao buscar venda"
                            })
                            return
                        })
        
     
        }).catch(function(error){
            console.log(error)
        })
       
    }
    consultarStatusVenda(requisicao, resposta){
        var not  = requisicao.body
        if (typeof not === 'string') {
            not = JSON.parse(not)
        }
        console.log("body")

        axios({
            method: 'get',
            headers: {'Content-type': 'application/x-www-form-urlendcoded; charset=ISO-8859-1'},
            url: ` ${urlAPI}/v3/transactions/notifications/${not.notificationCode}?email=${emailAPI}&token=${tokenAPI}&token=${tokenAPI}`,
        })
        .then(function (res) {
            if (res.status == 200) {
                var xml = res.data;
                var result = parser.xml2json(xml, {
                    compact: true,
                    spaces: 0
                });

                result = JSON.parse(result)
                console.log(result.transaction.status._text)
                var idVenda = result.transaction.reference._text
                if (result.transaction.status._text == "3") {
                    var dt =  {}
                    dt.pagamento_confirmado = true
                    dt.status = "Pagamento Aprovado";
                    db.collection('vendas').doc(idVenda).set(dt, {merge: true}).then(function(){
                        console.log("Pagamento com sucesso")
                         db
                         .collection('vendas')
                         .doc(idVenda)
                         .get()
                         .then(function (vend) {
                            var email = {
                                to: vend.data().destinatario.email,
                                message: {
                                    subject: 'Pagamento Confirmado',
                                    text: '',
                                    html: `
                                     <code>
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
                                                                                                                 
                                                                                                                 <td align="center" class="esd-block-text es-p10t es-m-txt-c"> <br> <br> <br>
                                                                                                                     
                                                                                                                     <h2 style=" color: #8F7E7E; ">Olá ${vend.data().destinatario.nome} seu pagamento foi confirmado com sucesso. <br>
                                                                                                                     <h2 style=" color: #8F7E7E; ">Obrigado pela sua compra! </h2>
                                                                                                                    </h2>

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
                                                                                                                 <div style="text-align: center;">
                                                                                                                  <a href="https://sunshinemoda.com.br/"  style=" font-size: 20px; background: #FAEAEA; color: #8F7E7E; text-transform: uppercase; text-transform: uppercase; border: 2px solid #d3c1c1; padding: 10px; border-radius: 5px;">Ir para a loja</a>
                                 
                                                                                                                 </div>
                                                                                                               
                                                                                                                 <br>
                                                                                                                 <br>
                                                                                                            
                                                                                                                 <td align="center" class="esd-block-social es-p15t es-p15b" style="font-size:0">
                                                                                                                     <table cellpadding="0" cellspacing="0" class="es-table-not-adapt es-social">
                                                                                                                           <tbody>   
                                                                                                                                  
                                                                                                                                <tr>
                                                                                                                                
                                                                                                                                    
                                                                                                                                    <td align="center" valign="top" class="es-p40r"><a target="_blank" href="https://www.instagram.com/sunshine_modapraiaa/"><img title="Instagram" src="https://ticvdv.stripocdn.email/content/assets/img/social-icons/logo-black/instagram-logo-black.png" alt="Inst" width="62"></a></td>
                                                                                                                                    
                                                                                                                                </tr>
                                                                                                                                
                                                                                                                         
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
                                                   
                                                 </td>
                                             </tr>
                                         </tbody>

                                     </table>
                                 </div>
                            </code>
                         `
                                }
                            }
                            db.collection('mail').add(email).then(function(){
                                resposta.status(200).send({status: "Pagamento Aprovado"})
                            }).catch(function(error){
                                console.log(error)
                            })
 
                         
                         })
                        })

                }else if (result.transaction.status._text == "6") {
                    resposta.status(500).send({status: "Pagamento Recusado"})

                }else if (result.transaction.status._text == "7") {
                    resposta.status(500).send({status: "Pagamento Cancelado"})

                }else {
                    resposta.status(500).send({status: "Error no Pagamento 1"})
                }  
            }else {
                resposta.status(500).send({status: "Error no Pagamento 2"})
            
            }
        })
        .catch(function (error) {
            console.log(error)
            console.log(requisicao.body)
            resposta.status(500).send({status: "Error no Pagamento 3"})
        })
    }
}

module.exports = new Pagseguro()