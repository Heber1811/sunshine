function returnDateNow(dt) {
    if (dt) {
        if(typeof dt === 'string') {
            dt = new Date(dt).getTime() + 1 * 24 * 60 * 60 * 1000
        }

        var date = new  Date(dt);
    }else {
        var date = new Date();
    }


var hours = String(date.getHours()).padStart(2, '0');
var minutes = String(date.getMinutes()).padStart(2, '0');
var day = String(date.getDate()).padStart(2, '0');
var month = String(date.getMonth() + 1 ).padStart(2, '0');
var year  = date.getFullYear();
var alltypesTime = {}
alltypesTime.date_timestamp = date;
alltypesTime.date_string_us = year + "" + month + "" + day; 
alltypesTime.date_string_br = day + "" + month + "" + year;
alltypesTime.date_value_us = year + "_" + month + "_" + day;
alltypesTime.date_value_br = day + "/" + month + "/" + year;
alltypesTime.date_hours = hours + ":" + minutes;
return alltypesTime;

}



function minhasCompras(){
    firebase.firestore().collection('vendas').where('comprador', "==", window.usuarioLogado.uid)
    .get().then(function(res){
       console.log(res)
       $.each(res.docs, function (i, snap) {
           var itens = ""
           var qtdItens = 0
           var valorTotal = 0


           $.each(snap.data().itens, function(){
               valorTotal += this.qtd * this.dados.preco_venda
               qtdItens += this.qtd
               itens += ` <div class="col-md-3">
                                <img src="${this.dados.foto_destaque}" style="height: 70px">
                          </div> 
                          <div class="col-md-9">
                             <b>Nome Produto: </b> ${this.dados.nome}<br>
                             <b>Quantidade: </b> ${this.qtd}<br>
                             <b>Valor Unidade: </b> R$ ${this.dados.preco_venda.toLocaleString('pt-br', {minimumFractionDigits: 2})}<br>
                             <b>Valor Produtos:  R$ ${this.dados.preco_venda.toLocaleString('pt-br', {minimumFractionDigits: 2})}<br>
                             </div>
                             <div class="col-md-12">
                               <hr>
                             </div>
                          
                             `
                             
           })
           
           var str = `
           <div class="col col-md-12 col-lg-6 col-12" style="margin-bottom: 20px">
               <div class="card" style="padding: 20px">
                  <div class="row">
                      <div  class="compras col col-md-3 col-12" style="text-align: center;  ">
                         <img src="${snap.data().itens[0].dados.foto_destaque}" style="width: 100%">
                      </div>
                      <div class="col col-md-5 col-12">
                         <b>Data Venda: </b> ${returnDateNow(snap.data().data_venda.seconds * 1000).date_value_br}<br>
                         <b>Quantidade de itens: </b> ${qtdItens}<br>
                         <b>Valor Total: </b> R$ ${valorTotal.toLocaleString('pt-br', {minimumFractionDigits: 2})}<br>
                         <b>Status: </b> ${(snap.data().status? snap.data().status : "Aguardando Pagamento")}<br>
                      </div>
                      <div style="padding-top: 10px" class="col col-md-4 col-12">
                           <button style="width:100%; text-align: center;"
                           onclick="verItens(this)" class="btn-c btnItensVenda">Mais Detalhes</button>
                           <button style="width:100%; text-aling:center; display:none"
                           onclick="verItens(this)" class="btn-c btnItensVenda">Menos Detalhes</button>
                           <button style="width:100%; text-aling:center; margin-top: 10px;"
                           onclick="verDestino(this)" class="btn-c btnEnderecoVendas">Mostrar Endereço</button>
                           <button style="width:100%; text-aling:center; margin-top: 10px; display:none; "
                           onclick="verDestino(this)" class="btn-c btnEnderecoVendas">Ocultar Endereço</button>
                    </div>
                    <div class="verItensVenda col-md-12" style="display:none;">
                         <div style="font-weight: bold; width:100%; padding-top 15px; text-align: center; text_transform: uppercase">
                              todos  Itens da venda
                         </div>
                         <hr>
                         <div class="row">
                              ${itens}    
                         </div>
                    </div>
                    <div class="verEnderecoVendas col-md-12" style="display: none">
                         <div style="font-weight: bold; width: 100%; padding-top: 15px; text-aligin: center; text-transform: uppercase">
                             Endereço de entrega
                         </div>
                         <hr>
                         <b>Nome/CPF: </b> ${snap.data().destinatario.nome}<br>
                         <b>Celular:  </b> ${snap.data().destinatario.celular}<br>           
                         <b>Email:  </b> ${snap.data().destinatario.email}<br>   
                         <b>Logradouro:  </b> ${snap.data().destinatario.logradouro}<br>   
                         <b>Complemento:  </b> ${snap.data().destinatario.complemento}<br>   
                         <b>Número:  </b> ${snap.data().destinatario.numero}<br>   
                         <b>Bairro:  </b> ${snap.data().destinatario.bairro}<br>      
                         <b>Cidade:  </b> ${snap.data().destinatario.cidade}<br>     
                         <b>Estado:  </b> ${snap.data().destinatario.estado}<br>     
                         <b>CEP:  </b> ${snap.data().destinatario.cep}<br>    
                    </div>
                </div> 
            </div>      
        </div>  `
        $("#appendVendas").append(str)
        
        })
    }).catch(function(error){
        console.log(error)
    })

}


function verItens(button){
    $(button).parent().parent().find('.verItensVenda').slideToggle()
    $(button).parent().parent().find('.btnItensVenda').toggle()

}

function verDestino(button){
    $(button).parent().parent().find('.verEnderecoVendas').slideToggle()
    $(button).parent().parent().find('.btnEnderecoVendas').toggle()

}

