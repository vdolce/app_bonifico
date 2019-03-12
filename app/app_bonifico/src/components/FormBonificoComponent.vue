<template>
  <form grid-list-xl text-xs-center>
    
    <h1 class="text-md-center">Informazioni Bonifico</h1>
    <v-layout row wrap>
      <v-flex xs12 offset-xs5 >
      &nbsp;
    </v-flex>
      <!-- Text Nome -->
      <v-flex xs10 offset-xs1>
        <v-text-field
          v-model="payee_name"
          prepend-icon="person_pin"      
          label="Nome Beneficiario"
          required        
        ></v-text-field>
      </v-flex>
      <!-- Text Cognome -->
      <v-flex xs10 offset-xs1>
        <v-text-field
          v-model="payee_surname"        
          prepend-icon="person_pin"
          label="Cognome Beneficiario"
          required
        ></v-text-field>
      </v-flex>
      <!-- Importo -->
      <v-flex xs10 offset-xs1>
        <v-text-field
          type="number"
          v-model="amount"
          prepend-icon="euro_symbol"
          label="Importo"      
          required
        ></v-text-field>
      </v-flex>
      <!-- Text IBAN --> 
      <v-flex xs10 offset-xs1>
        <v-text-field
          v-model="iban_code"        
          prepend-icon="account_balance"
          label="IBAN"
          :counter="27"
          required
          
        ></v-text-field>
      </v-flex>

      <v-flex xs10 offset-xs1>
        <v-text-field
          v-model="description"        
          prepend-icon="info"
          label="Causale"
          :counter="50"
          required          
        ></v-text-field>
      </v-flex>
    
    <v-flex xs10 offset-xs1>
    <!-- Calendar -->
    <v-layout row wrap>
        <v-flex xs12 sm6 md4>
        <v-dialog
          ref="dialog"
          v-model="modal"
          :return-value.sync="execution_date"
          persistent
          lazy
          full-width
          width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="execution_date"
              label="Seleziona data"
              prepend-icon="event"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker id="date_picker" color="yellow" v-model="execution_date" scrollable value="YYYY-MM-DD" :min="today_date"  :max="limit_date">
            <v-spacer></v-spacer>
            <v-btn flat color="black" @click="modal = false">Cancel</v-btn>
            <v-btn flat color="black" @click="$refs.dialog.save(execution_date)">OK</v-btn>
          </v-date-picker>
        </v-dialog>
      </v-flex>
      </v-layout>
    </v-flex>
    <v-flex xs12 offset-xs5 >
      &nbsp;
    </v-flex>
    <v-flex xs12 offset-xs5 >
      <v-btn large color="primary" @click="invia_dati">Esegui Bonifico</v-btn>
      <!-- <v-btn @click="clear">Cancella</v-btn> -->
    </v-flex>
    </v-layout>

    <p> </p>

    <v-alert v-if="verify_response_status"   
      :value="true"
      type="info"  
      color="warning">
      Attenzione, saldo non disponibile.
    </v-alert>

    <v-alert v-if="errors.length" :value="true"
      color="error"
      icon="warning"
      outline>
      <b>Per favore correggi i seguenti errori:</b>
      <ul>
        <li v-for="error in errors"> {{ error }}</li>
      </ul>
    </v-alert>

  </form>

</template>

<script>
import axios from 'axios';

/* eslint-disable */
  export default {

    data: () => ({
      
      errors: [],
      verify_response_status: false,
      valid: false,
      account_number: '0001234566', // usato come costante
      customer_id: '101132',        // usato come costante
      payee_name: '',
      payee_surname: '',
      amount: '',
      currency: 'EUR',
      iban_code: '',
      execution_date: '',
      description:'',
      
      picker: new Date().toISOString().substr(0, 10),
        modal: false,
        landscape: false,
        reactive: false,
        today_date: undefined,
        limit_date: undefined


      /*firstname: '',
      lastname: '',
      nameRules: [
        v => !!v || 'Name is required',
        v => v.length <= 10 || 'Name must be less than 10 characters'
      ],
      email: '',
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+/.test(v) || 'E-mail must be valid'
      ],
      picker: new Date().toISOString().substr(0, 10),
        modal: false,
        landscape: false,
        reactive: false*/
    }),

    mounted () {

        var prepare_build_url = 'http://localhost:3000/private/cliente/' + this.customer_id + '/conto/' + this.account_number + '/bonifico/prepare'
      
        axios
        .get(prepare_build_url)
        .then(response =>{
            this.today_date = response.data.data.oggi,
            this.limit_date = response.data.data.dataLimite
            })
    },

    methods: {

      //Check required form fields

      invia_dati: function() {  
        
        // se i campi del form sono correttamente compilati procedi con il submit
        // campi valorizzati e importo bonifico positivo
        if (this.payee_name && this.payee_surname && this.amount && parseInt(this.amount) >0 && this.iban_code && this.execution_date) {
          
          var verify_build_url = 'http://localhost:3000/private/cliente/' + this.customer_id + '/conto/' + this.account_number + '/bonifico/verify'
              
          axios
            .post(verify_build_url, {
              // dati inviati nel body della verify
              payee_name: this.payee_name,
              payee_surname: this.payee_surname,
              amount: this.amount,
              currency: 'EUR',
              iban_code: this.iban_code,
              execution_date: this.execution_date,
              description: this.description
            })
          .then(response => {
            
            
              if(response.data.result.outcome == 'FAIL')  // se la verify da esito negativo rimane nella pagina del form
                    this.verify_response_status = true                            
                
              else {    // se la verify da esito positivo mostra alcuni dati del bonifico da confermare

                    var amount_value_response = response.data.data.totalAmount.amount       // importo bonifico da passare tramite parametro all'execute
                    var amount_currency_response = response.data.data.totalAmount.currency  // valuta importo bonifico
                    var commission_value_response = response.data.data.commissions.commissions       // importo commissioni bonifico
                    var commission_currency_response = response.data.data.commissions.currency  // valuta commissioni bonifico
                    
                    var transaction_id = response.data.transaction.id

                    this.verify_response_status = false 
                    this.$emit("changeForm", amount_value_response, amount_currency_response, commission_value_response, commission_currency_response, transaction_id)
                    //this.$emit("update_transaction_id", response.data.transaction.id)
              }
                //var status_verify_response = 
                //console.dir(response.data.result.outcome)

            })
        }

        this.errors = [];

        if (!this.payee_name) {
          this.errors.push('Per effettuare correttamente il bonifico serve inserire il nome del destinatario ');
        }

        if (!this.payee_surname) {
          this.errors.push('Per effettuare correttamente il bonifico serve l\' inserimento il cognome del destinatario ');
        }

        if (!this.amount || parseInt(this.amount, 10) <= 0) {  //non è possibile inserire importi negativi
          this.errors.push('Per effettuare correttamente il bonifico serve inserire un importo corretto');
        }
        if (!this.iban_code) {
          this.errors.push('Per effettuare correttamente il bonifico serve inserire l\'iban del destinatario ');
        }

        if (!this.execution_date) {
          this.errors.push('Per effettuare correttamente il bonifico serve inserire la data di esecuzione ');
        }

        
      },

      
    }


  }
</script>