(function(){
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
    var t;

    function getTimeLeft(countdownEvent) {
        var dString = countdownEvent.date;
        var d1 = new Date(dString);
        var d2 = new Date();

        var months = dateDiff.inMonths(d2, d1);
        var days = dateDiff.inDays(d2, d1);
        var hours = dateDiff.inHours(d2, d1);
        var weeks = dateDiff.inWeeks(d2, d1);
        var minutes = dateDiff.inMinutes(d2, d1);
        var seconds = dateDiff.inSeconds(d2, d1);

        let line1 = '';
        let line2 = ''; 
        let spaces=`&nbsp;&nbsp;&nbsp;`;

        if (days > 1) {
            line1 = `<div><span class="big">${days}</span>d</div>`;
            line2 = `<div><span>${hours}</span>h${spaces}<span>${minutes}</span>m${spaces}<span>${seconds}</span>s</div>`;
        } else if (hours > 1) {
            line1 = `<div><span class="big">${hours}</span>h</div>`;
            line2 = `<div><span>${minutes}</span>m${spaces}<span>${seconds}</span>s</div>`;
        } else if (minutes > 1) {
            line1 = `<div><span class="big">${minutes}</span>m</div>`;
            line2 = `<div><span>${seconds}</span>s</div>`;
        } else {
            line1 = `<div><span class="big">${seconds}</span>s</div`;
        }
        document.getElementById('time').innerHTML = `months: ${months} | weeks: ${weeks} | days: ${days} | hours: ${hours} | minutes: ${minutes} | seconds: ${seconds}`;
        document.getElementById('time').innerHTML = line1 + line2;
        document.getElementById('name').innerHTML = countdownEvent.name + " in";
        t = setTimeout(function () {
            getTimeLeft(countdownEvent);
        }, 1000);
    }

    function setCoundownEvent() {
        chrome.storage.sync.get('countdownEvent', function(storedObj){
          if (Object.keys(storedObj).length === 0) {
            console.log("Using default new year date as countdown event");
            getTimeLeft({'name': 'new year 2018', 'date': '01-01-2018'});
            return;
          }
          console.log(storedObj.countdownEvent);
          if (storedObj.countdownEvent) {
            getTimeLeft(storedObj.countdownEvent);
          }
        });
    }

    function saveCountdownEvent(event_name, event_date) {
        var countdownEvent = {};
        countdownEvent.name = event_name;
        countdownEvent.date = event_date;
        chrome.storage.sync.set({ 'countdownEvent': countdownEvent }, function() {
          // Notify that we saved.
          console.log("Countdown event saved");
        });
    }

    function makeBGBlack() {
        console.log("here");
        $("body").css("background-color","#333");
        $("body").css("color","#fff");
        $(".night_mode").addClass("lights_off");
        $("img.edit-icon").attr("src","img/edit-white.png");
        $("img.night-icon").attr("src","img/night-white.png");
    }

    function makeBGWhite() {
        $("body").css("background-color","white");
        $("body").css("color","#000");
        $(".night_mode").removeClass("lights_off");
        $("img.edit-icon").attr("src","img/edit-black.png");
        $("img.night-icon").attr("src","img/night-black.png");
    }

    function setBG() {
        chrome.storage.sync.get('settings', function(storedObj){
          if (Object.keys(storedObj).length === 0) {
            console.log("Using default settings");
          }
          console.log(storedObj.settings);
          if (storedObj.settings) {
            if (storedObj.settings.mode == 'night') {
                makeBGBlack();
            } else {
                makeBGWhite();
            }
          }
        });
    }

    // saveCountdownEvent("Shipping", '11-15-2017');
    setCoundownEvent();
    // getTimeLeft();
    setBG();

    $('.night_mode').on("click", function() {
    var settings = {};
      if ($(this).hasClass("lights_off")) {
        makeBGWhite();
        settings.mode = 'day';
        chrome.storage.sync.set({ 'settings': settings }, function() {
          // Notify that we saved.
          console.log("Settings saved");
        });
        return;
      }
      settings['mode'] = 'night';
      chrome.storage.sync.set({ 'settings': settings }, function() {
        // Notify that we saved.
        console.log("Settings saved");
        makeBGBlack();
      });
    });

    $("#update_event").on("click", function(){
        console.log("Yopes");
        event.preventDefault();
        console.log("form submitted");
        var event_name = $('#event_name').val();
        var event_date = $('#event_date').val();
        console.log("%s %s", event_name, event_date);
        $('.close').click();
        clearTimeout(t);
        saveCountdownEvent(event_name, event_date);
        setCoundownEvent();
    });

})();
