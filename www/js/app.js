/*jslint browser: true*/
/*global $, steempay, config, navigation, window, document*/

//if device goes offline, show connection page
window.addEventListener('offline', function() {
  app.$data.route = 'connection';
});
//if device comes online, show connection page
window.addEventListener('online', function() {
  app.$data.route = 'home';
});
//add listener for NFC
document.addEventListener("deviceready", function() {
  steempay.nfc.checkNfc();
});

var app = new Vue({
  el: '#app',
  data: {
    route: 'home',
    account: `@${config.account}`,
    price: "0",
    usd: "",
    memo: 'memo'
  },
  methods: {
    clear: function() {
      this.usd = '';
      this.price = '';
      this.memo = '';
    },
    add: function(num) {
      this.usd = `${this.usd}${num}`;
    },
    purchase: async function() {
      //generate random memo
      let memo = steempay.utils.randomMemo();
      this.memo = memo;
      //get current price
      console.log("usd: " + parseFloat(this.usd));
      console.log("rate: " + parseFloat(await steempay.utils.getExchangeRate('steem')));
      this.price = `${(parseFloat(this.usd) / parseFloat(await steempay.utils.getExchangeRate('steem'))).toFixed(3)} STEEM`;
      console.log("price: " + this.price);
      //start listening for NFC
      steempay.nfc.startListening(function() {
        steempay.transaction.isWatching = true;
        let memo = app.$data.memo;
        //start looking for transaction
        console.log("account: " + config.account);
        console.log("price: " + this.price);
        console.log("memo: " + app.$data.memo);
        steempay.transaction.watch(config.account, app.$data.price, memo, function() {
          //on success, show confirm page and clear form
          app.$data.route = 'confirmed';
          app.clear();
          //after 10 seconds, show home page
          setTimeout(function() {
            app.$data.route = 'home';
          }, 10000);
        });
        console.log("you can now scan a tag");
      });
      //show NFC page after we start listening
      this.route = 'nfc';
    },
    cancel: function() {
      //stop looking for transaction
      steempay.nfc.stopListening();
      steempay.transaction.watchStop();
      this.clear();
      this.route = 'home';
    },
    soon: function() {
      //temp function for coming soon sweetalert
      swal("Sorry", "Feature coming soon :(", "error");
    }
  },
  created() {
    //if device is offline, show connection page
    if (!navigator.onLine) {
      this.route = 'connection';
    }
    document.getElementById("status").innerHTML = 'processing payment...';
  }
});