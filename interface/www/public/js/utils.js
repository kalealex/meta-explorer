
var Utils = (function(){

    return {
       getURLParameter: function (param) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
               var sParameterName = sURLVariables[i].split('=');
               if (sParameterName[0] == param) {
                      return sParameterName[1];
               }
        }
       },

       startAsAnimationMode: function() {
         return this.getURLParameter('mode') == 'animation';
       }
    }
   
   }())

