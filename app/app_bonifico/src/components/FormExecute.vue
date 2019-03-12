<template>
  <form grid-list-xl>
    <h1 v-if="card_result_verify" class="text-md-center">Conferma Informazioni Bonifico</h1>
    <h1 v-if="card_result_execute" class="text-md-center">Riepilogo</h1>
    <p></p>

<!-- Card RESULT.VERIFY-->
    <v-layout row wrap>
      <v-flex v-if="card_result_verify" xs10 offset-xs1>
          <v-card elevation="5" color="white" >
            <v-card-text > Importo Bonifico: {{amount_value_response}} {{amount_currency_response}}</v-card-text>
          </v-card>
      </v-flex>
      
      <v-flex v-if="card_result_verify" xs10 offset-xs1>
        <p></p>
      </v-flex>
      <v-flex v-if="card_result_verify" xs10 offset-xs1>
          <v-card  elevation="5" color="white" >
            <v-card-text>Totale Commissioni: {{commission_value_response}} {{commission_currency_response}}</v-card-text>
          </v-card>
      </v-flex>
      <v-flex v-if="card_result_verify" xs10 offset-xs1>
        <p></p>
      </v-flex>
      <v-flex v-if="card_result_verify" xs10 offset-xs1>
        &nbsp;
      </v-flex>
      <v-flex v-if="card_result_verify" xs2 offset-xs1 >
        <v-btn large color="success"  @click="esegui_bonifico">Conferma</v-btn>
      </v-flex>
      <v-flex v-if="card_result_verify" xs2  >
        <v-btn large color="yellow" @click="reload_page">Indietro</v-btn>
      </v-flex>
    </v-layout>

<!-- Card RESULT.EXECUTE-->
    <div>
      <v-flex v-if="card_result_execute" xs10 offset-xs1>
          <v-card elevation="5" color="white" >
            <v-card-text v-text="text_amount_value"></v-card-text>
            <v-card-text v-text="text_amount_currency"></v-card-text>
            <v-card-text v-text="cro_id"></v-card-text>
          </v-card>
      </v-flex>
      <v-flex v-if="card_result_execute" xs10 offset-xs1 >
          &nbsp;
      </v-flex>
      <v-flex v-if="card_result_execute" xs10 offset-xs1 >
          <v-btn large color="success" @click="reload_page">Torna alla sezione bonifici</v-btn>
      </v-flex>
    </div>

    <p> </p>
    <v-alert    
       v-if="card_result_verify"
      :value="true"
      type="info"          
    >
    Premi conferma per eseguire il bonifico 
    </v-alert>

    <v-alert v-if="card_result_execute"   
      :value="true"
      type="info"  
      color="success"        
    >
    Il Bonifico è stato eseguito con successo
    </v-alert>

  </form>
  
</template>

<script>
  import axios from 'axios';

/* eslint-disable */
  export default {
    props:{
        amount_value_response: '',
        amount_currency_response: '',
        commission_value_response: '',
        commission_currency_response: '',
        transaction_id: ''
    },

    data: () => ({

      account_number: '0001234566',
      customer_id: '101132',
      //transaction_id: '',// 'c7cedccc-3c21-4746-bb7b-93f08542d3af'
      //text_amount_value: '',
      //text_amount_currency: '',
      //text_charge_value: '',
      //text_charge_currency: '',
      cro_id: '',
      text_amount: '',
      text_prova:'',
      card_result_verify: true,
      card_result_execute: false      
    }),


    methods: {

        esegui_bonifico: function() {        
          
          //transaction_id = 
          var execute_build_url = 'http://localhost:3000/private/cliente/' + this.customer_id + '/conto/' + this.account_number + '/bonifico/'+ this.transaction_id +'/execute'
          
          axios
          .get(execute_build_url)
          .then(response => {

              // dati visualizzati nella pagina finale dell'execute
              this.text_amount_value = response.data.result.messages[0].message,  // importo bonifico
              this.text_amount_currency = response.data.result.messages[1].message,  // valuta bonifico
               console.dir(response.data.result.messages)

              this.cro_id = "Codice CRO: " + response.data.data.cro,
              this.card_result_verify= false,
              this.card_result_execute= true}
              )
        },

        // al click del bottone indietro ricarica la pagina mostrando il form iniziale del verify 
        reload_page: function () {
            location.reload()
        },

    }

  }
</script>