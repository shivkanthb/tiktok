(function(){
    console.log("hi");
    var dateDiff = {
        inDays: function(d1, d2) {
            var t2 = d2.getTime();
            var t1 = d1.getTime();
     
            return parseInt((t2-t1)/(24*3600*1000));
        },

        inMinutes: function(d1, d2) {
            var t2 = d2.getTime();
            var t1 = d1.getTime();

            return parseInt((t2-t1)/(60*1000));
        },

        inSeconds: function(d1, d2) {
            var t2 = d2.getTime();
            var t1 = d1.getTime();

            return parseInt((t2-t1)/(1000));
        },

        inHours: function(d1, d2) {
            var t2 = d2.getTime();
            var t1 = d1.getTime();

            return parseInt((t2-t1)/(3600*1000));
        },
     
        inWeeks: function(d1, d2) {
            var t2 = d2.getTime();
            var t1 = d1.getTime();
     
            return parseInt((t2-t1)/(24*3600*1000*7));
        },
     
        inMonths: function(d1, d2) {
            var d1Y = d1.getFullYear();
            var d2Y = d2.getFullYear();
            var d1M = d1.getMonth();
            var d2M = d2.getMonth();
     
            return (d2M+12*d2Y)-(d1M+12*d1Y);
        },
     
        inYears: function(d1, d2) {
            return d2.getFullYear()-d1.getFullYear();
        }
    }

    function checkTime(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    function startTime() {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        // add a zero in front of numbers<10
        m = checkTime(m);
        s = checkTime(s);
        document.getElementById('time').innerHTML = h + ":" + m + ":" + s;
        t = setTimeout(function () {
            startTime()
        }, 500);
    }
    // startTime();

    function getTimeLeft() {
        var dString = "Jan, 01, 2018";
        var d1 = new Date(dString);
        var d2 = new Date();

        var months = dateDiff.inMonths(d2, d1);
        var days = dateDiff.inDays(d2, d1);
        var hours = dateDiff.inHours(d2, d1);
        var weeks = dateDiff.inWeeks(d2, d1);
        var minutes = dateDiff.inMinutes(d2, d1);
        var seconds = dateDiff.inSeconds(d2, d1);

        document.getElementById('time').innerHTML = `months: ${months} | weeks: ${weeks} | days: ${days} | hours: ${hours} | minutes: ${minutes} | seconds: ${seconds}`;
        t = setTimeout(function () {
            getTimeLeft();
        }, 500);
    }

    getTimeLeft();

    $('.night_mode').on("click", function() {
      if ($(this).hasClass("lights_off")) {
        $("body").css("background-color","white");
        $("body").css("color","#000");
        $(".night_mode").removeClass("lights_off");
        var settings = {};
        settings.mode = 'night';
        chrome.storage.sync.set({ 'settings': settings }, function() {
          // Notify that we saved.
          console.log("Settings saved");
        });
        return;
      }
      settings.mode = 'day';
      chrome.storage.sync.set({ 'settings': settings }, function() {
        // Notify that we saved.
        console.log("Settings saved");
        $("body").css("background-color","#333");
        $("body").css("color","#fff");
        $(".night_mode").addClass("lights_off");
      });
    });
})();
