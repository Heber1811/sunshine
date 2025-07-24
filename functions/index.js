const pagseguro = require('./class/pagseguro');
const functions = require('firebase-functions');
const db = require('./class/firebase.js');
const admin = require('firebase-admin')
const cors = require('cors')({
    origin: true
});


exports.users = functions.firestore
.document('usuarios/{docId}')
.onCreate((change, context) => {
    console.log(JSON.stringify(change.data()))
    admin.auth()
      .createUser({
          uid: context.params.docId,
          email: change.data().email,
          password: change.data().senha,
      })
      .then((userRecord) => {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log('Successfully created new user:', userRecord.uid);
      })
      .catch((error) => {
        console.log('Error creating new user:', error);
      });
})

exports.recuperaToken = functions.https.onRequest((requisicao, resposta) => {
    cors(requisicao, resposta, () => {
    pagseguro.recuperaToken(requisicao, resposta)
    })
})

exports.pagamentoCartaoCredito = functions.https.onRequest((requisicao, resposta) => {
    cors(requisicao, resposta, () => {
    pagseguro.criandoSolicitacaoPagamentoCartaoCredito(requisicao, resposta)
    })
})

exports.consultarStatusVenda = functions.https.onRequest((requisicao, resposta) => {
    cors(requisicao, resposta, () => {
      pagseguro.consultarStatusVenda(requisicao, resposta)
    })

})



