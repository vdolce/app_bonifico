<template>
  <v-app>

    <!-- Toolbar -->
    <v-toolbar color="yellow" app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Che Banca!</span>     

      </v-toolbar-title>
      <v-spacer></v-spacer>
      
    </v-toolbar>

    <!-- Content -->
    <v-content>
      <v-flex sm6 offset-sm3>
      <v-card>        
        <p></p>
        <p></p>
        
        <!-- Form Invia Dati Bonifico (Verify)-->
        <form-bonifico-component v-if="form_verify" v-on:changeForm = "changeForm"/>
        <!-- Form Esegui Bonifico (Execute) -->
        <form-execute v-if="form_execute" v-bind:amount_value_response="amount_value_response" v-bind:amount_currency_response="amount_currency_response" 
                                          v-bind:commission_value_response="commission_value_response" v-bind:commission_currency_response="commission_currency_response"
                                          v-bind:transaction_id="transaction_id" />
      </v-card>
    </v-flex>
    </v-content>
    
  </v-app>
</template>

<script>
import FormBonificoComponent from './components/FormBonificoComponent'
import FormExecute from './components/FormExecute'

export default {
  /* eslint-disable */
  name: 'App',
  data () {
    return {
      form_verify: true,
      form_execute: false,
      amount_value_response: '',  // importo bonifico
      amount_currency_response: '', // valuta importo bonifico
      commission_value_response: '',  // importo commissioni bonifico
      commission_currency_response: '', // valuta commissioni bonifico
      transaction_id:''
    }
  },

  components: {
    
    FormBonificoComponent,
    FormExecute
  },

  methods: {
    // funzione per passare tramite parametro dati del verify.result all' execute.request
    changeForm: function (amount_value_response, amount_currency_response, commission_value_response, commission_currency_response, transaction_id) {
        
        this.form_verify = false;
        this.form_execute = true;
        this.transaction_id = transaction_id;
        this.amount_value_response = amount_value_response;
        this.amount_currency_response = amount_currency_response;
        this.commission_value_response = commission_value_response;
        this.commission_currency_response = commission_currency_response;

    }
  }
  
}
</script>
