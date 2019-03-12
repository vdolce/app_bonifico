/*    
  -----------------------------------------------
              APP BONIFICO
              Author: Valeria Dolce
  -----------------------------------------------
*/

const express = require('express')          // framework Express
const app = express()
const port = 3000                           // localhost:3000
const sql = require('mssql')                // connection to sql server
const crypto = require('crypto');           // per generare la chiave della transazione
const fs = require('fs');                   // scrivere su file
const uuidv4 = require('uuid/v4')           // universal unique identifier (UUID v4)
const random = require('random')            // generatore numeri random
const jsonfile = require('jsonfile')        // per leggere da file json
let date = require('date-and-time')         // importo modulo date&time di node (npm)
var bodyParser = require('body-parser');    // parsing del body POST

// configurazione per accesso DB Sql
const config = {
    user: '!app_user',
    password: 'appuser',
    server: 'localhost', // localhost per la connessione al db
    database: 'db_app_bonifico'
};

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

// *.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*
// *.*.*.*.* BONIFICO PREPARE .*.*.*.*.*.*.*.*
// *.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*
app.get('/private/cliente/:customer_id/conto/:account_number/bonifico/prepare', function (req, res) {
        
    // crea oggetto tipo date npm
    let now = new Date();

    // 1 - data corrente
    let current_date = date.format(now, 'YYYY-MM-DD') //'DD/MM/YYYY'

    // 2 - data massima per l'ordine del bonifico - data corrente + 30gg
    let max_date = date.format(date.addDays(now, 30), 'YYYY-MM-DD') 

    // 2 - genero request_id come hash (customer_id, date&time)
    const hash = crypto.createHash('md5');   // metodo di hashing
    var request_id = hash.update(req.params.customer_id, date.format(now, 'YYYY/MM/DD HH:mm:ss')).digest('hex');

    // 3 - salvo le info in un oggetto json
    var prepare_json_obj = {
        "result": {
          "messages": [],
          "outcome": "SUCCESS",
          "requestId": request_id
        },
        "data": {
          "oggi": current_date,
          "dataLimite": max_date
        }
      }

    
    // salvo su file json il contenuto dell' oggetto per comodita'
    fs.writeFile("./tmp/sc1.bonifico.prepare.RESPONSE.json", JSON.stringify(prepare_json_obj), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 

    // invio l'oggetto json come risposta del server
    res.send(prepare_json_obj)
})


// *.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*
// *.*.*.*.* BONIFICO VERIFY .*.*.*.*.*.*.*.*.
// *.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*

app.post('/private/cliente/:customer_id/conto/:account_number/bonifico/verify', function (req, res) {
    
     // salvo i dati presenti dentro il body della post
     var customer_id = req.params["customer_id"];       // codice cliente
     var account_number = req.params["account_number"]; // numero conto
     var currency = req.body.currency;                  // divisa monetaria
     var amount = req.body.amount;                      // importo bonifico
     var payee_name = req.body.payee_name;              // nome del beneficiario
     var payee_surname = req.body.payee_surname;        // cognome del beneficiario
     var iban_code = req.body.iban_code;                // codice iban
     var description = req.body.description;            // causale bonifico
     var execution_date = req.body.execution_date;      // data esecuzione bonifico -- in sql la data ha formato YYYY-MM-DD - convertire in query
     

     console.dir(req.body)

     // genero request_id come hash (customer_id, date&time)
     // crea oggetto tipo date npm
     let now = new Date();
     const hash = crypto.createHash('md5');   // metodo di hashing
     var request_id = hash.update(req.params.customer_id, date.format(now, 'YYYY/MM/DD HH:mm:ss')).digest('hex');              
     
     var balance = 0    // saldo del cc da aggiornare con la query
     
    // 1 - interrogazione DB per recuperare il saldo cc

    sql.connect(config, err => {
        // ... error checks
        if (err) {
            console.log("DB Connection Error")
            return sql.close();
          }

        // Stored Procedure:  usp_get_balance
        // La store procedure recupera il saldo del cc e lo salva nella variabile balance
        new sql.Request()
        .input('customer_id', sql.Int, req.params.customer_id)
        .input('account_number', sql.NChar,req.params.account_number)
        .execute('usp_get_balance', (err, result) => {
                
        balance = result.recordset[0]["balance"];
        console.dir("balance")
        console.dir(balance)
        console.dir("amount")
        console.dir(amount)
        
        //sql.close()    
            
        console.dir("query 1 - chiusa")


       // 2 - *** verifica disponibilita' saldo ***

      // confronto tra saldo conto corrente e importo bonifico
        if(parseInt(amount, 10) <= parseInt(balance, 10)){ // se importo bonifico inferiore al saldo cc posso procedere
            
            console.dir("Importo bonifico disponibile!");

            // genero la chiave
            //genero chiave hash (customer_id, date&time)
            // const hash = crypto.createHash('sha256');   // metodo di hashing
            // let now = new Date();
            // var request_id = hash.update(req.params.customer_id, date.format(now, 'YYYY/MM/DD HH:mm:ss')).digest('hex');


            // creo un codice univoco  della transazione
            var transaction_id = uuidv4()

            // connessione al DB per aggiorare i dati
            // sql.connect(config, err => {
            //           // ... error checks
            //           if (err) {
            //               console.log("DB Connection Error")
            //               return sql.close();
            //             }
              
                      console.dir("--dati in input alla query 2--")
                      console.dir(transaction_id)
                      console.dir(customer_id)
                      console.dir(account_number)
                      console.dir(execution_date)
                      console.dir(iban_code)
                      console.dir(payee_name)
                      console.dir(payee_surname)
                      console.dir(description)
                      console.dir(amount)
                      // Stored Procedure:  usp_update_balance_and_transaction
                      // La store procedure crea una nuova entry nella tabella transactions
                      new sql.Request()
                      .input('transaction_id', sql.NVarChar, transaction_id)
                      .input('request_id', sql.NChar, request_id)                      
                      .input('account_number', sql.NChar,account_number)                  
                      .input('execution_date', sql.Date, execution_date)    // in sql la data ha formato YYYY-MM-DD
                      .input('payee_name', sql.NVarChar, payee_name)
                      .input('payee_surname', sql.NVarChar,payee_surname)
                      .input('iban_code', sql.NChar, iban_code)
                      .input('description', sql.NVarChar,description)
                      .input('amount', sql.Decimal,amount)                  
                      .execute('usp_update_transactions', (err, result) => {
                              
                      
                      sql.close()    
                      //console.dir(err);    
                      console.dir("query 2 - chiusa")
                          
                      })
          //})
          
          // sql.on('error', err => {
                      
          //         console.dir(err)
          // })

            // creare object json e salvare oggetto json che sarà la response
            var verify_json_obj = {
                "result": {
                  "messages": [],
                  "outcome": "SUCCESS",
                  "requestId": request_id
                },
                "data": {
                  "totalAmount": {
                    "amount": amount,
                    "currency": currency
                  },
                  "commissions": {
                    "commissions": "0,00",
                    "currency": currency
                  }
                },
                "transaction": {
                  "id": transaction_id
                }
              }

            console.dir(verify_json_obj)
        
            // salvo su file json il contenuto dell' oggetto
            fs.writeFile("./tmp/sc1.bonifico.verify.RESPONSE.json", JSON.stringify(verify_json_obj), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });   


              res.send(verify_json_obj);
        }
        // caso in cui il saldo non è sufficiente
        else{
              console.dir("attenzione, saldo non disponibile!");

              var verify_json_obj = {
                "result": {
                  "messages": [],
                  "outcome": "FAIL",
                  "requestId": request_id
                }
              }

              // salvo su file json il contenuto dell' oggetto
            fs.writeFile("./tmp/sc1.bonifico.verify.RESPONSE.json", JSON.stringify(verify_json_obj), function(err) {
                  if(err) {
                      return console.log(err);
                  }
                  console.log("The file was saved!");
              });   
              
            res.send(verify_json_obj);
            sql.close()
        }   

      })
    })
    
    sql.on('error', err => {
                
        console.dir(err)
    })


})



// *.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*
// *.*.*.*.* BONIFICO EXECUTE .*.*.*.*.*.*.*.*
// *.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*

app.get('/private/cliente/:customer_id/conto/:account_number/bonifico/:transaction_id/execute', function (req, res) {
      
    // 1 - leggo da file json le info del bonifico
    //const file_to_read = './tmp/sc1.bonifico.verify.RESPONSE.json'


    // genero request_id come hash (customer_id, date&time)
     // crea oggetto tipo date npm
     let now = new Date();
     const hash = crypto.createHash('md5');   // metodo di hashing
     var request_id = hash.update(req.params.customer_id, date.format(now, 'YYYY/MM/DD HH:mm:ss')).digest('hex');




   
    // crodice cro di 11 cifre per identificare il bonifico
    var cro_id = Math.floor(10000000000 + Math.random() * 90000000000)
    console.dir(cro_id)
 
  

    // 2 - recupero dal DB i dettagli della transazione

    sql.connect(config, err => { 
      
      if (err) {
          console.log("DB Connection Error")
          return sql.close();
        }

      // Stored Procedure
      //****************** usp_get_transaction_info *******************
      new sql.Request()
      .input('customer_id', sql.Int, req.params.customer_id)
      .input('account_number', sql.NChar,req.params.account_number)
      .input('transaction_id', sql.NVarChar ,req.params.transaction_id)
      .input('cro_id', sql.Numeric ,cro_id)
      .execute('usp_update_balance_and_operations', (err, result) => {
              
      console.dir("risultato sql")
      console.dir(result)
      // gestire info
  
        // salvo su oggetto json l'esito del bonifico
      var execute_json_obj = {
        "result": {
          "messages": [
            {
              "message": "Hai effettuato un bonifico a " + result.recordset[0]["payee_name"] + " " + result.recordset[0]["payee_surname"],
            },
            {
              "message": "Una volta prodotta, troverai la contabile delle tue operazioni tra i documenti!",
            }
          ],
          "outcome": "SUCCESS",
          "requestId": result.recordset[0]["request_id"]
        },
        "data": {
          "cro":  cro_id
        }
      }
        // salvo su file json il contenuto dell' oggetto
        fs.writeFile("./tmp/sc1.bonifico.execute.RESPONSE.json", JSON.stringify(execute_json_obj), function(err) {
          if(err) {
              return console.log(err);
          }
          console.log("The file was saved!");
        });   

        res.send(execute_json_obj)
        sql.close()    

        console.dir("SQL connection closed")
          
      })
    })
    

})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))