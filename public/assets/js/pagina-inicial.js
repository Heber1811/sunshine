function iniciarCarouselNovidades(){
  $('.owl-carousel').owlCarousel({
      items:4,
      lazyLoad:true,
      loop:true,
      dots:true,
      margin:20,
      responsiveClass:true,
          responsive:{
              0:{
                  items:1,
              },
              600:{
                  items:2,
              },
              1000:{
                  items:4,
              }
          }
  });
}

function buscarNovidades(){
  firebase.firestore().collection("produtos")
  .where("deletado", "==", false)
  .orderBy("cadastrado_em", "desc")
  .limit(12)
  .get()
  .then(function(produtos){
      $.each(produtos.docs, function(){
          adicionarNovidade(this)
      })
      iniciarCarouselNovidades()
  }).catch(function(e){
      console.log(e)
  })
}

function adicionarNovidade(produto){
  if(produto.data().foto_destaque){
      var foto = produto.data().foto_destaque
  }else{
      var foto = "./assets/img/sem_foto.png"
  }

  if(produto.data().nome.length > 40){
    var ret = '...'
}else{
    var ret = ''
}
  

var precoOriginal = produto.data().preco_venda
if(produto.data().desconto && produto.data().desconto > 0){
  var precoDesconto = ((precoOriginal / 100) * produto.data().desconto)
  var precoComDesconto = precoOriginal - precoDesconto
  var preco = `
 <span style="font-size: 18px;">
   R$ ${precoComDesconto.toLocaleString('pt-br', {minimumFractionDigits: 2, maximumFractionDigits: 2  })}
   <span  style="margin-left: 10px;  text-decoration: line-through; color: black; font-size:13px;">
   R$ ${precoOriginal.toLocaleString('pt-br', {minimumFractionDigits: 2 })}
   </span>
  </span>
  <br>

   `

   

}else{
   var preco = "R$" +precoOriginal.toLocaleString('pt-br', {minimumFractionDigits: 2 })
 
}


 var htmlNovidade = `
<a target="_blank" href="produto.html?cod=${produto.id}">
<div class="featured-item text-center">
  <img src="${foto}" style="border-radius: 10px; width: auto; min-height: 220px; max-height: 220px; max-width: 100%; display: inline">
  <h4 style="min-height: 50px">${produto.data().nome.substr(0, 40)} ${ret}</h4>
  <h6>R$ ${preco}</h6>
  <br>
  <button class="btn" style="background: #161515;  margin-top: 5px; ">Ver Mais/comprar</button>
</div>
</a>
`
$("#novidades_produtos").append(htmlNovidade)
}

function pesquisarProduto(){
  var pesquisaCript = encodeURI($("#campo_pesquisa").val())
  window.location.href = "./busca.html?por="+pesquisaCript
}

$(document).ready(function(){
  buscarNovidades()
})



$('document').ready(function() {
  // Back to top
  var backTop = $(".back-to-top");
  
  $(window).scroll(function() {
    if($(document).scrollTop() > 400) {
      backTop.css('visibility', 'visible');
    }
    else if($(document).scrollTop() < 400) {
      backTop.css('visibility', 'hidden');
    }
  });
  
  backTop.click(function() {
    $('html').animate({
      scrollTop: 0
    }, 1000);
    return false;
  });
});
