const pagseguro = require('./class/pagseguro');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { response } = require('express');
const jsonParser = bodyParser.json();
const portaDoEndpoint = 8081;
const meusEndpoints = express();
meusEndpoints.use(cors());

meusEndpoints.use(bodyParser.json());

meusEndpoints.get('/recuperaToken', (requisicao, resposta) => {
    pagseguro.recuperaToken(requisicao, resposta)
})

meusEndpoints.post('/pagamentoCartaoCredito', (requisicao, resposta) => {
    pagseguro.criandoSolicitacaoPagamentoCartaoCredito(requisicao, resposta)
})

meusEndpoints.post('/consultarStatusVenda', (requisicao, resposta) => {
    pagseguro.consultarStatusVenda(requisicao, resposta)
})

meusEndpoints.listen(portaDoEndpoint, () => {
    console.log(`Endpoints ligado em https://127.0.0.1:${portaDoEndpoint}`)
})



