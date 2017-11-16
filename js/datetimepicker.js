/* 
Date Time Picker v1.0.3

This content is released under the MIT License.
http://www.opensource.org/licenses/mit-license.php 

Copyright (C) 2017 Colin McIntyre
 
Permission is hereby granted, free of charge, to any person obtaining 
a copy of this software and associated documentation files (the 
"Software"), to deal in the Software without restriction, including 
without limitation the rights to use, copy, modify, merge, publish, 
distribute, sublicense, and/or sell copies of the Software, and to 
permit persons to whom the Software is furnished to do so, subject to 
the following conditions:

The above copyright notice and this permission notice shall be 
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

DateTimePicker.version = '1.0.3';
function DateTimePicker(id,opt){
    var _datetimePicker = {
		version:DateTimePicker.version,
        // working date, which we will keep modifying to render the calendars        
        d: '',       
        // just so that we need not request it over and over        
        today: '',            
        // current user-choice in date object format                
        choice: {},           
        // to check availability of next/previous buttons        
        limit: {},        
        //used to render the contents in        
        contents:null,       
        // main datepicker container        
        picker: null,    
		//used to add and remove the applied document events
		events:{},
        //used for toggling            
        open:null,            
        // selector for target inputs        
        attachTo: null,            
        // original input element (used for input/output)
        input:null, 
        options:{
            pickerClass: 'datetimepicker',
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			daySuffix:["th", "st", "nd", "rd"],
			nextText:'&raquo;',//>>
			prevText:'&laquo;',//<<
            dayShort: 2,
            monthShort: 3,
            startDay: 1,
            timePicker: false,
            timePickerOnly: false,           
            timePickerFormat:24,
			minuteIncrement:1,
            yearPicker: true,
            format: 'd/m/Y',
            allowEmpty: false,
			allowInput: false,
            startView: 'month', 
            positionOffset: { x: 0, y: 0 },
            minDate: null,
            maxDate: null,  
            inputOutputFormat: 'T', 
            startDate:null,
            debug: false,
            toggleElementsOnly:true,
            toggleElements: null,
			beforeShow: null,
            onClose: null,
            onSelect: null,
			onChange: null
        },
        initialise:function(attachTo, options){
            var self = this;
            this.attachTo = attachTo;
            this.options = this.merge(this.options,options);
            this.bind(false);
            
            if (this.options.timePickerOnly) {
                this.options.timePicker = true;
                this.options.startView = 'time';
            }
            this.formatMinMaxDates();

            return this;
        },
        formatMinMaxDates: function() {
            if (this.options.minDate && this.options.minDate.format) {
                this.options.minDate = this.unformat(this.options.minDate.date, this.options.minDate.format);
				this.options.minDate.setHours(0);
                this.options.minDate.setMinutes(00);
                this.options.minDate.setSeconds(00);
            }
            if (this.options.maxDate && this.options.maxDate.format) {
                this.options.maxDate = this.unformat(this.options.maxDate.date, this.options.maxDate.format);
                this.options.maxDate.setHours(23);
                this.options.maxDate.setMinutes(59);
                this.options.maxDate.setSeconds(59);
            }
        },
		setDate:function(newdate){
			//if no date is supplied then reset startDate and clear elements value attribute
			this.options.startDate = newdate || null;
			if(!newdate){
				var inputs = document.querySelectorAll(this.attachTo);
				for(var idx = 0; idx < inputs.length; idx++){
					inputs[idx].value = '';
				}				
			}		
			this.bind();
		},
		refresh:function(){
			this.bind();
		},
		bind:function(){
            var self = this;

            if (this.options.toggleElements) {
                var togglers = document.querySelectorAll(this.options.toggleElements);
            }
            
            var inputs = document.querySelectorAll(this.attachTo);
            for(var idx = 0; idx < inputs.length; idx++){
                var input = inputs[idx];
                
                var initValue = '';
				if (this.options.startDate) {
					if(Object.prototype.toString.call(this.options.startDate).indexOf('Date') != -1){
						initValue = this.format(this.options.startDate, this.options.format); 
					} else {
						initValue = this.format(new Date(this.unformat(this.options.startDate, (this.options.inputOutputFormat ? this.options.inputOutputFormat : this.options.format))), this.options.format); 
					}
				} else if (input.value){
					var unfmtd = this.unformat(input.value, (this.options.inputOutputFormat ? this.options.inputOutputFormat : this.options.format)); //check to see if it is of a valid format
					if(unfmtd){
						initValue = this.format(new Date(unfmtd), this.options.format); 
					} 
				} else if (!this.options.allowEmpty) {
					initValue = this.format(new Date(), this.options.format);
				}
                
                input.className = (input.className.indexOf('has-datetimepicker') == -1 ? 'has-datetimepicker' + (input.className.length > 0 ? ' ': ''): '') + input.className;
                input.value = initValue;
                
                input.onkeydown = function(e){
                    e = e ? e : window.event;
                    if (self.options.allowEmpty && (e.keyCode == 46 || e.keyCode == 8)) {//delete or backspace
                        this.value = '';
                        self.close(true);
                    } else if (e.keyCode == 9 || e.keyCode == 27) {//tab or esc
                        self.close(true);
                    } else if(e.keyCode == 13){//enter
                        if(!self.open){
                            self.onFocus(this);
							e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
                        }
                    } else {
						if((!self.options.allowInput) && (!e.ctrlKey && (e.keyCode != 67 || e.keyCode != 65))){//allow select all and copy
							e.preventDefault ? e.preventDefault() : e.returnValue = false;
						}
                    }
                };
				
				input.onpaste = function(e){
					return false;/*stop any pasting of value into field*/
				};

                if (this.options.toggleElements) {
                    if(togglers[idx]){
                        togglers[idx].style.cursor = 'pointer';
						togglers[idx].className = (togglers[idx].className.indexOf('datetimepicker-toggler') == -1 ? 'datetimepicker-toggler' + (togglers[idx].className.length > 0 ? ' ':''):'')+ togglers[idx].className;
						togglers[idx].inputField = input;
                        togglers[idx].onclick = function(e) {
                            if(self.open){
                                self.close(true);
                            } else {
                                self.onFocus(this.inputField,this);
                            }
                        };
                    }
                }    
                
                //if there is NO toogle element OR we are NOT Just using the toggle element bind to the input.
                if(!this.options.toggleElements || !this.options.toggleElementsOnly){
                    input.onfocus = function(e) {
                        self.onFocus(this);
                    };
                    input.ondblclick = function(e) {
                        if(!self.open){
                            self.onFocus(this);
                        }
                    };
                }
            }
        },
        onFocus: function(input,trigger) {
			if (this.options.debug && window.console)
				console.log("DEBUG: DateTimePicker Event Fired: beforeShow");
			if(this.options.beforeShow)
				this.options.beforeShow();
				
            if(!trigger){ 
                trigger = input;
            }          
            this.input = input;
            var initDate;
            
            if (input.value) {
                initDate = this.unformat(input.value, this.options.format).valueOf();
            } else {
                initDate = new Date();
                if (this.options.maxDate && initDate.valueOf() > this.options.maxDate.valueOf()) {
                    initDate = new Date(this.options.maxDate.valueOf());
                }
                if (this.options.minDate && initDate.valueOf() < this.options.minDate.valueOf()) {
                    initDate = new Date(this.options.minDate.valueOf());
                }
            }

            this.show(trigger, initDate);
            this.open = true;
        },
        select: function(values) {
            this.choice = this.merge(this.choice,values);            
            var d = this.dateFromObject(this.choice);
            var inoutformat = this.format(d, (this.options.inputOutputFormat ? this.options.inputOutputFormat : this.options.format));// return the format selected
			var formated = this.format(d, this.options.format);
			
			if(this.input.value != formated){
				if (this.options.debug && window.console)
					console.log("DEBUG: DateTimePicker Event Fired: onChange - returned: "+ inoutformat);
				if(this.options.onChange)
					this.options.onChange(inoutformat);
			}
            
			this.input.value = formated;
			
			if (this.options.debug && window.console)
				console.log("DEBUG: DateTimePicker Event Fired: onSelect - returned: "+ inoutformat);
            if(this.options.onSelect)
				this.options.onSelect(inoutformat);
            
			this.close(true);
        },
        getDate: function(format){
			var inputs = document.querySelectorAll(this.attachTo);
			var dts = [];
			for(var i = 0; i < inputs.length; i++){
				var v = (inputs[i].value ? (format ? this.format(new Date(this.unformat(inputs[i].value, this.options.format)),format) : this.unformat(inputs[i].value, this.options.format)) : null);
				dts.push(v);
			}
			return (dts.length == 1 ? dts[0] : dts);
		},
        allowZoomOut: function() {
            if (this.mode == 'time' && this.options.timePickerOnly){ return false; }
            if (this.mode == 'decades'){ return false; }
            if (this.mode == 'year' && !this.options.yearPicker){ return false; }
            return true;
        },    
        zoomOut: function() {
            if (!this.allowZoomOut()){ return; }
            if (this.mode == 'year') {
                this.mode = 'decades';
            } else if (this.mode == 'time') {
                this.mode = 'month';
            } else {
                this.mode = 'year';
            }
            this.render();
        },
        next:function(){
            if (this.mode == 'decades') {
                this.d.setFullYear(this.d.getFullYear() + 20);
            } else if (this.mode == 'year') {
                this.d.setFullYear(this.d.getFullYear() + 1);
            } else if (this.mode == 'month') {
                this.d.setDate(1);
                this.d.setMonth(this.d.getMonth() + 1);
            }
            this.render();
        },
        previous:function(){
            if (this.mode == 'decades') {
                this.d.setFullYear(this.d.getFullYear() - 20);
            } else if (this.mode == 'year') {
                this.d.setFullYear(this.d.getFullYear() - 1);
            } else if (this.mode == 'month') {
                this.d.setDate(1);
                this.d.setMonth(this.d.getMonth() - 1);
            }
            this.render();
        },
		gotoToday:function(){
			var t = new Date();
			if (this.mode == 'decades') {
                this.d.setFullYear(t.getFullYear());
            } else if (this.mode == 'year') {
                this.d.setFullYear(t.getFullYear());
            } else if (this.mode == 'month') {
                this.d.setDate(t.getDate());
				this.d.setMonth(t.getMonth());
				this.d.setFullYear(t.getFullYear());
            }
			this.merge(this.choice,{ day: this.d.getDate(), month: this.d.getMonth(), year: this.d.getFullYear() });
            this.render();
		},
		show:function(trigger, timestamp){
            this.formatMinMaxDates();
            if (timestamp) {
                this.d = new Date(timestamp);
            } else {
                this.d = new Date();
            }
            this.today = new Date();
            this.choice = this.dateToObject(this.d);
            this.mode = (this.options.startView == 'time' && !this.options.timePicker) ? 'month' : this.options.startView;
            this.render();		
			var position = this.getPositioning(trigger);
            this.setStyle(position,this.picker);
        },
        close: function(force,e) {
            if (!this.picker) {
                return;
            }      
            var clickOutside = (e && (e.target ? e.target : e.srcElement) != this.picker && !this.isChildOf((e.target ? e.target : e.srcElement),this.picker));
            if (force || clickOutside) {
                this.destroy();
            }
			
        },
        destroy: function() {
            document.body.removeChild(this.picker);
            this.picker = null;
            this.open = false;
			this.unbindEvents();
			if (this.options.debug && window.console)
				console.log("DEBUG: DateTimePicker Event Fired: onClose");
			if(this.options.onClose)
				this.options.onClose();
        },
		unbindEvents: function(){
			document[(document.removeEventListener ? 'removeEventListener' : 'detachEvent')]((!document.removeEventListener ? 'on' : '')+'keydown',this.events.keydown,false);
			document[(document.removeEventListener ? 'removeEventListener' : 'detachEvent')]((!document.removeEventListener ? 'on' : '')+'mousedown',this.events.mousedown,false);
		},
		bindEvents:function(){
			var self = this;
            //used to determine if a mouse click is outside of the picker
            this.events.mousedown = function(e){
                e = e ? e : window.event;
                self.close(false,e);
            };
			// keyboard shortcuts
			this.events.keydown = function(e){
				e = e ? e : window.event;
				if(self.picker){
					switch(e.keyCode){
						case 9://tab
						case 27://esc
						case 65://a (to allow for select all)
						case 67://c (to allow for copy)
							self.input.focus();
							self.close(true);
							return;
						case 13://enter
							if(self.mode == 'time'){
								self.picker.getElementsByClassName('ok')[0].click();
							} else if(self.mode == 'month' && !self.options.timePicker){
								self.select();
							} else {
								self.mode = (self.mode == 'decades' ? 'year' : (self.mode == 'year' ? 'month' : ( self.mode == 'month' && self.options.timePicker ? 'time' : self.mode)));
								self.merge(self.choice,{ day: self.d.getDate(), month: self.d.getMonth(), year: self.d.getFullYear() });
								self.render();
							}
							break;
						case 32://space bar
							self.zoomOut();//change views
							break;						
						case 36://home key 
							self.gotoToday();//gotoToday 
							break;
						case 37://left arrow
						case 38://up arrow
						case 39://right arrow
						case 40://down arrow
							if(self.mode == 'time'){
								self.picker.getElementsByClassName('hour')[0].focus();
							} else {
								var td = new Date(self.d);
								if (self.mode == 'decades') {
									td.setFullYear(self.d.getFullYear() + (e.keyCode == 40 ? 5 : (e.keyCode == 39 ? 1 : (e.keyCode == 38 ? -5 : -1))));
									
									if(self.options.maxDate && td.valueOf() > self.options.maxDate.valueOf()){ 
										td = new Date(self.options.maxDate);
									} else if(self.options.minDate && td.valueOf() < self.options.minDate.valueOf()){
										td = new Date(self.options.minDate);
									}
									
								} else if (self.mode == 'year') {
									td.setMonth(self.d.getMonth() + (e.keyCode == 40 ? 3 : (e.keyCode == 39 ? 1 : (e.keyCode == 38 ? -3 : -1))));
									
									if(self.options.maxDate && td.valueOf() > self.options.maxDate.valueOf()){ 
										td = new Date(self.options.maxDate);
									} else if(self.options.minDate && td.valueOf() < self.options.minDate.valueOf()){
										td = new Date(self.options.minDate);
									}
									
								} else if (self.mode == 'month') {
									td.setDate(self.d.getDate() + (e.keyCode == 40 ? 7 : (e.keyCode == 39 ? 1 : (e.keyCode == 38 ? -7 : -1))));	
									
									if((self.options.maxDate && td.valueOf() > self.options.maxDate.valueOf()) 
										|| (self.options.minDate && td.valueOf() < self.options.minDate.valueOf())){
											break;
									}  									
								} 

								self.d = new Date(td);
								self.merge(self.choice,{ day: self.d.getDate(), month: self.d.getMonth(), year: self.d.getFullYear() });
								self.render();
							}
							break;
					}
					e.preventDefault ? e.preventDefault() : e.returnValue = false;
					return false;
				}
			}
			//If IE or Opera required to use attachEvent
			document[(document.addEventListener ? 'addEventListener' : 'attachEvent')]((!document.addEventListener ? 'on' : '')+'keydown',this.events.keydown,false);
			document[(document.addEventListener ? 'addEventListener' : 'attachEvent')]((!document.addEventListener ? 'on' : '')+'mousedown',this.events.mousedown,false);
		},
        render:function(){
            if (!this.picker) {
                this.constructPicker();
            } else {
                while (this.contents.hasChildNodes()) {
                    this.contents.removeChild(this.contents.lastChild);
                }
            }
            
            // remember current working date
            var sd = new Date(this.d.getTime());
            // intially assume both left and right are allowed
            this.limit = { right: false, left: false };
            
            if (this.mode == 'decades') {
                this.renderDecades();
            } else if (this.mode == 'year') {
                this.renderYear();
            } else if (this.mode == 'time') {
                this.renderTime();
                this.limit = { right: true, left: true }; // no left/right in timeview
            } else {
                this.renderMonth();
            }
            
            this.setStyle({visibility:(this.limit.left ? 'hidden' : 'visible')},this.picker.getElementsByClassName('previous')[0]);
            this.setStyle({visibility:(this.limit.right ? 'hidden' : 'visible')},this.picker.getElementsByClassName('next')[0]);
            this.setStyle({cursor:(this.allowZoomOut() ? 'pointer' : 'default')},this.picker.getElementsByClassName('titleText')[0]);

            this.d = sd;
        },
        constructPicker: function() {
            var self = this;
            var zi = this.maxZindex();
			
            this.picker = document.createElement('div');
			this.picker.className = 'datetimepicker' + (this.options.pickerClass == 'datetimepicker' ? '' : ' '+this.options.pickerClass);
			
            this.setStyle({zIndex:(zi === 0 ? 1001 : zi + 1),top:0,left:0},this.picker);
            document.body.appendChild(this.picker);

            var head = document.createElement('div');
            head.className = 'header';
            this.picker.appendChild(head);            
            var titlecontainer = document.createElement('div');
            titlecontainer.className = 'title';
            head.appendChild(titlecontainer);
            
            var prev = document.createElement('div');
            prev.className = 'previous';
            prev.onclick = function(e){
                self.previous();
            };
            prev.innerHTML = this.options.prevText;
            head.appendChild(prev);
            
            var next = document.createElement('div');
            next.className = 'next';
            next.onclick = function(e){
                self.next();
            };
            next.innerHTML = this.options.nextText;
            head.appendChild(next);

            var title = document.createElement('div');
            title.className = 'titleText';
            title.onclick = function(e){
                self.zoomOut();                
            };
            titlecontainer.appendChild(title);    
            
            var body = document.createElement('div');
            body.className = 'body';
            this.picker.appendChild(body);

            this.contents = document.createElement('div');
            this.setStyle({ position: 'absolute', top: 0, left: 0, width: body.offsetWidth, height: body.offsetHeight },this.contents);
            body.appendChild(this.contents);   
			
			this.bindEvents();
        },
        renderTime: function() {
            var self = this;
            var fmt12 = (this.options.timePickerFormat === 12);
            
            var container = document.createElement('div');
            container.className = 'time'+(fmt12 ? ' f12':'');
            this.contents.appendChild(container);
            
            var tt = this.picker.getElementsByClassName('titleText')[0];
            if (this.options.timePickerOnly) {
                tt.innerHTML = 'Select a time';
            } else {
                tt.innerHTML = this.format(this.d, 'j M, Y');
            }

            var hour = document.createElement('input');                  
			hour.value = this.format(this.d,(fmt12 ? 'h':'H'));
			hour.formatValue = this.d.getHours();
			hour.maxLength = 2;
            hour.className = 'hour';
			
            this.events.hourmousewheel = function(e){
                e = e ? e : window.event;
                var v = hour.formatValue;
                var a = hour.value.toInt();
                hour.focus();
                if ((e.wheelDelta ? e.wheelDelta/120 : -e.detail/3) > 0) {
                    v = (v < 23) ? v + 1 : 0;
                    a = (a < (fmt12 ? 12 : 23)) ? a + 1 : (fmt12 ? 1 : 0);
                } else {
                    v = (v > 0) ? v - 1 : 23;
                    a = ((a > (fmt12 ? 1 : 0)) ? (a - 1) : (fmt12 ? 12 : 23));
                }                
                if(fmt12){
                    self.picker.getElementsByClassName('ampm')[0].innerHTML = (v < 12 ? 'am' : 'pm');
                }
                hour.formatValue = v;               
                hour.value = self.leadZero((fmt12 ? a : v));                
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
				e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
            };
			
			hour[(hour.addEventListener ? 'addEventListener' : 'attachEvent')]((!hour.addEventListener ? 'on' : '')+((/Firefox/i.test(navigator.userAgent)) ? 'DOMMouseScroll' : 'mousewheel'),this.events.hourmousewheel,false);
			
            hour.onkeydown = function(e){
                e = e ? e : window.event;
                var v = this.formatValue;
                var a = this.value.toInt();                
				switch(e.keyCode){
					//case 9://tab
					case 27://esc
						self.input.focus();
						self.close(true);
						return;
					case 38:
						v = (v < 23) ? v + 1 : 0;
						a = (a < (fmt12 ? 12 : 23)) ? a + 1 : (fmt12 ? 1 : 0);
						break;
					case 40:
						v = (v > 0) ? v - 1 : 23;
						a = ((a > (fmt12 ? 1 : 0)) ? (a - 1) : (fmt12 ? 12 : 23));
						break;
					case 39:
					case 37:
						self.picker.getElementsByClassName('minutes')[0].focus();
						break;
					case 13:
						self.picker.getElementsByClassName('ok')[0].click();
						return;
				}
				
				if(fmt12){
					self.picker.getElementsByClassName('ampm')[0].innerHTML = (v < 12 ? 'am' : 'pm');
				}
				
				this.formatValue = v;
				this.value = self.leadZero((fmt12 ? a : v));
					
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
				e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
            };
            container.appendChild(hour);

			var inc = (self.options.minuteIncrement > 59 || self.options.minuteIncrement < 0 ? 0 : self.options.minuteIncrement);//the value of which to increment the minute portion of the date
            var minutes = document.createElement('input');
            minutes.value = this.leadZero((inc == 0 ? 0 :(Math.round(this.d.getMinutes()/inc) * inc) % 60)); //if not 0 round to the nearest minuteIncrement
            minutes.maxLength = 2;
            minutes.className = 'minutes';
			
			if(inc == 0){
				minutes.disabled = true;
			} else {
			
				this.events.minutesmousewheel = function(e){
					e = e ? e : window.event;
					var v = minutes.value.toInt();
					minutes.focus();
					if ((e.wheelDelta ? e.wheelDelta/120 : -e.detail/3) > 0) {
						//v = (v < (60 - inc)) ? v + inc : 0;
						v = ((v + inc > 59) ? v + inc - 60 : v + inc);
					} else {
						//v = (v > 0) ? v - inc : (60 - inc);
						v = (((v - inc) < 0) ? v - inc + 60 : v - inc);
					}
					minutes.value = self.leadZero(v);
					e.preventDefault ? e.preventDefault() : e.returnValue = false;
					e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
				};
				
				minutes[(minutes.addEventListener ? 'addEventListener' : 'attachEvent')]((!minutes.addEventListener ? 'on' : '')+((/Firefox/i.test(navigator.userAgent)) ? 'DOMMouseScroll' : 'mousewheel'),this.events.minutesmousewheel,false);
				
			}
			
            minutes.onkeydown = function(e){
                e = e ? e : window.event;
                var v = this.value.toInt();
				var inc = self.options.minuteIncrement;
				
				switch(e.keyCode){
					//case 9://tab
					case 27://esc
						self.input.focus();
						self.close(true);
						return;
					case 38:
						v = (v < (60 - inc)) ? v + inc : 0;
						break;
					case 40:
						v = (v > 0) ? v - inc : (60 - inc);
						break;
					case 37:
					case 39:
						self.picker.getElementsByClassName('hour')[0].focus();
						break;
					case 13:
						self.picker.getElementsByClassName('ok')[0].click();
						return;
				}

                this.value = self.leadZero(v);
				
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
				e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
            };
            container.appendChild(minutes);
            
            var separator = document.createElement('div');
            separator.className = 'separator';
            separator.innerHTML = ':';
            container.appendChild(separator);

            if(fmt12){
                var ampm = document.createElement('div');
                ampm.className = 'ampm';
                ampm.innerHTML = this.format(this.d, 'a');
                container.appendChild(ampm);
            }
            
            var btn = document.createElement('input');
            btn.type = 'submit';
            btn.value = '🙌';
            btn.className = 'ok';
            btn.onclick = function(e){
                var h = self.picker.getElementsByClassName('hour')[0].formatValue;
                var m = self.picker.getElementsByClassName('minutes')[0].value.toInt();
                var o = self.merge(self.dateToObject(self.d),{hours:h,minutes:m});
                e = e ? e : window.event;
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
                self.select(o);
            };
            btn.maxLength = 2;
            container.appendChild(btn);
        },
        renderMonth: function() {
            var month = this.d.getMonth();
            var tt = this.picker.getElementsByClassName('titleText')[0];
            tt.innerHTML = this.options.months[month] + ' ' + this.d.getFullYear();
            
            this.d.setDate(1);
            while (this.d.getDay() != this.options.startDay) {
                this.d.setDate(this.d.getDate() - 1);
            }
            
            var container = document.createElement('div');
            container.className = 'days';
            this.contents.appendChild(container);
            
            var titles = document.createElement('div');
            titles.className = 'titles';
            container.appendChild(titles);
            
            var d, i, classes, el, weekcontainer;
            
            for (d = this.options.startDay; d < (this.options.startDay + 7); d++) {
                var nd = document.createElement('div');
                nd.className = 'title day day' + (d % 7);
                nd.innerHTML = this.options.days[(d % 7)].substring(0,this.options.dayShort);
                titles.appendChild(nd);
            }
            
            var available = false;
            var t = this.today.toDateString();
            var currentChoice = this.dateFromObject(this.choice).toDateString();
            
            for (i = 0; i < 42; i++) {
                classes = [];
                classes.push('day');
                classes.push('day'+this.d.getDay());
                if (this.d.toDateString() == t){ 
                    classes.push('today'); 
                }
                if (this.d.toDateString() == currentChoice){ 
                    classes.push('selected'); 
                }
                if (this.d.getMonth() != month){ 
                    classes.push('otherMonth');
                }
            
                if (i % 7 === 0) {
                    weekcontainer = document.createElement('div');
                    weekcontainer.className = 'week week'+(Math.floor(i/7));
                    container.appendChild(weekcontainer);
                }
                
                el = document.createElement('div');
                el.className = classes.join(' ');
                el.innerHTML = this.d.getDate();
                el.choice = { day: this.d.getDate(), month: this.d.getMonth(), year: this.d.getFullYear() };
                weekcontainer.appendChild(el);
                
                if (this.limited('date')) {
                    el.className += ' unavailable';
                    if (available) {
                        this.limit.right = true;
                    } else if (this.d.getMonth() == month) {
                        this.limit.left = true;
                    }
                } else {
                    available = true;
                    var self = this;
                    el.onclick = function(e){                    
                        var ch = this.choice;
                        if (self.options.timePicker) {
                            self.d.setDate(ch.day);
                            self.d.setMonth(ch.month);
                            self.mode = 'time';
                            self.render();
                        } else {
                            self.select(ch);
                        }
                    };
                }
                this.d.setDate(this.d.getDate() + 1);
            }
            if (!available){
                this.limit.right = true;            
            }
        },
        renderYear: function() {
            var self = this;
            var month = this.today.getMonth();
            var thisyear = this.d.getFullYear() == this.today.getFullYear();
            var selectedyear = this.d.getFullYear() == this.choice.year;    
            
            this.picker.getElementsByClassName('titleText')[0].innerHTML = this.d.getFullYear();
            this.d.setMonth(0);
            
            var i, e;
            var available = false;
            
            var container = document.createElement('div');
            container.className = 'months';
            this.contents.appendChild(container);
            
            for (i = 0; i <= 11; i++) {
                e = document.createElement('div');
                e.className = 'month month'+(i+1)+(i == month && thisyear ? ' today' : '')+(i == this.choice.month && selectedyear ? ' selected' : '');
                e.innerHTML = (this.options.monthShort ? this.options.months[i].substring(0, this.options.monthShort) : this.options.months[i]);
                e.choice = i;
                container.appendChild(e);
                this.d.setMonth(i);
                if (this.limited('month')) {
                    e.className += ' unavailable';
                    if (available) {
                        this.limit.right = true;
                    } else {
                        this.limit.left = true;
                    }
                } else {
                    available = true;
                    e.onclick = function(e){
                        self.d.setDate(1);
                        self.d.setMonth(this.choice);
						self.merge(self.choice,{ month: self.d.getMonth() });
                        self.mode = 'month';
                        self.render();
                    };
                }
            }
            if (!available){
                this.limit.right = true;
            }
        },
        renderDecades: function() {
            var self = this;
            // start neatly at interval (eg. 2000 instead of 2007)
            while (this.d.getFullYear() % 20 > 0) {
                this.d.setFullYear(this.d.getFullYear() - 1);
            }
            
            this.picker.getElementsByClassName('titleText')[0].innerHTML = this.d.getFullYear() + '-' + (this.d.getFullYear() + 20 - 1);
            
            var i, y, e;
            var available = false;
            
            var container = document.createElement('div');
            container.className = 'years';
            this.contents.appendChild(container);
            
            if (this.options.minDate && this.d.getFullYear() <= this.options.minDate.getFullYear()) {
                this.limit.left = true;
            }
            
            for (i = 0; i < 20; i++) {
                y = this.d.getFullYear();
                
                e = document.createElement('div');
                e.className = 'year year' + i + (y == this.today.getFullYear() ? ' today' : '') + (y == this.choice.year ? ' selected' : '');
                e.innerHTML = y;
                e.choice = y;
                container.appendChild(e);
            
                if (this.limited('year')) {
                    e.className += ' unavailable';
                    if (available) {
                        this.limit.right = true;
                    } else {
                        this.limit.left = true;
                    }
                } else {
                    available = true;
                    e.onclick = function(e){
                        self.d.setFullYear(this.choice);
						self.merge(self.choice,{ year: self.d.getFullYear() });
                        self.mode = 'year';
                        self.render();
                    };
                }
                this.d.setFullYear(this.d.getFullYear() + 1);
            }
            if (!available) {
                this.limit.right = true;
            }
            if (this.options.maxDate && this.d.getFullYear() >= this.options.maxDate.getFullYear()) {
                this.limit.right = true;
            }
        },
		limited: function(type) {
            var cs = this.options.minDate;
            var ce = this.options.maxDate;
            if (!cs && !ce){ return false; }
            
            switch (type) {
                case 'year':
                    return (cs && this.d.getFullYear() < this.options.minDate.getFullYear()) || (ce && this.d.getFullYear() > this.options.maxDate.getFullYear());
                case 'month':
                    var ms = ('' + this.d.getFullYear() + this.leadZero(this.d.getMonth())).toInt();
                    return cs && ms < ('' + this.options.minDate.getFullYear() + this.leadZero(this.options.minDate.getMonth())).toInt()
                        || ce && ms > ('' + this.options.maxDate.getFullYear() + this.leadZero(this.options.maxDate.getMonth())).toInt();
                case 'date':
                    return (cs && this.d < this.options.minDate) || (ce && this.d > this.options.maxDate);
            }
        },
		getPositioning: function(trigger){
			var w = Math.max(trigger.clientWidth, trigger.scrollWidth, trigger.offsetWidth);
            var h = Math.max(trigger.clientHeight, trigger.scrollHeight, trigger.offsetHeight);
			var l = 0;
			var t = 0;
            if (trigger.offsetParent) {
                do {
                    l += trigger.offsetLeft;
                    t += trigger.offsetTop;
                } while (trigger = trigger.offsetParent);
            }

			l += this.options.positionOffset.x; //add option offset
			t += (h + this.options.positionOffset.y);//add trigger height and option offset
			
			//check if picker will be out of view
			var dw = Math.max( 
							document.documentElement.clientWidth, document.body.scrollWidth, 
							document.documentElement.scrollWidth, document.body.offsetWidth, 
							document.documentElement.offsetWidth);
            var dh = Math.max(
							document.documentElement.clientHeight, document.body.scrollHeight, 
							document.documentElement.scrollHeight, document.body.offsetHeight, 
							document.documentElement.offsetHeight);
			
			if((l + this.picker.offsetWidth) > dw){
				l = (l - this.picker.offsetWidth + w);
				if(l < 0){
					l = 0;
				}
			}

			if((t + this.picker.offsetHeight) > dh){
				t = (t - this.picker.offsetHeight - h);
				if(t < 0){
					t = 0;
				}
			}

            return {left:l,top:t};
        },
        merge: function(leftObj,rightObj){
            for(name in rightObj){
                if(leftObj[name] === rightObj[name]){
                    continue;
                }                
                leftObj[name] = rightObj[name];
            }
            return leftObj;
        },
        isChildOf: function(child,parent){
            if(parent && child){
                if(parent === child){
                    return true;
                }
                var children = parent.getElementsByTagName(child.tagName);
                if(children.length > 0){
                    for (var i = 0; i < children.length; i++) {
                        if (children[i] === child) {
                            return true;
                        }
                    }
                    return false;                                
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
        dateToObject: function(d) {
            return {
                year: d.getFullYear(),
                month: d.getMonth(),
                day: d.getDate(),
                hours: d.getHours(),
                minutes: d.getMinutes(),
                seconds: d.getSeconds()
            };
        },
        dateFromObject: function(values) {
            var d = new Date();
            d.setDate(1);
            var type = ['year', 'month', 'day', 'hours', 'minutes', 'seconds'];

            for(var i = 0; i < type.length; i++){
                var v = values[type[i]];
                if (v === null || v === undefined){
                    return;
                }
                switch (type[i]) {
                    case 'day': d.setDate(v); break;
                    case 'month': d.setMonth(v); break;
                    case 'year': d.setFullYear(v); break;
                    case 'hours': d.setHours(v); break;
                    case 'minutes': d.setMinutes(v); break;
                    case 'seconds': d.setSeconds(v); break;
                }
            }
            return d;
        },
        leadZero: function(v) {
            return v < 10 ? '0'+v : v;
        },
        format:function(t,format) {
            var f = '';
			var d = t.getDate();
            var h = t.getHours();
            var m = t.getMonth();
            
            for (var i = 0; i < format.length; i++) {
                switch(format.charAt(i)) {
                    case '\\': i++; f+= format.charAt(i); break;
                    case 'y': f += (t.getFullYear() + '').substring(2); break;
                    case 'Y': f += t.getFullYear(); break;
                    case 'm': f += this.leadZero(m + 1); break;
                    case 'n': f += (m + 1); break;
                    case 'M': f += this.options.months[m].substring(0,this.options.monthShort); break;
                    case 'F': f += this.options.months[m]; break;
                    case 'd': f += this.leadZero(d); break;
                    case 'j': f += d; break;
                    case 'D': f += this.options.days[t.getDay()].substring(0,this.options.dayShort); break;
                    case 'l': f += this.options.days[t.getDay()]; break;
                    case 'G': f += h; break;
                    case 'H': f += this.leadZero(h); break;
                    case 'g': f += (h % 12 ? h % 12 : 12); break;
                    case 'h': f += this.leadZero(h % 12 ? h % 12 : 12); break;
                    case 'a': f += (h > 11 ? 'pm' : 'am'); break;
                    case 'A': f += (h > 11 ? 'PM' : 'AM'); break;
                    case 'i': f += this.leadZero(t.getMinutes()); break;
                    case 's': f += this.leadZero(t.getSeconds()); break;
                    case 'U': f += Math.floor(t.valueOf() / 1000); break; 
					case 'T': f += t.valueOf(); break; 
					case 'S': f += this.options.daySuffix[d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]; break;
                    default:  f += format.charAt(i);
                }
            }
            return f;
        },
        unformat: function(t, format) {
            var d = new Date();
            d.setMonth(0);
            d.setDate(1);
            var a = {};
            var c, m;
            t = t.toString();
            
            for (var i = 0; i < format.length; i++) {
                c = format.charAt(i);
                switch(c) {
                    case '\\': r = null; i++; break;
                    case 'y': r = '[0-9]{2}'; break;
                    case 'Y': r = '[0-9]{4}'; break;
                    case 'm': r = '0[1-9]|1[012]'; break;
                    case 'n': r = '[1-9]|1[012]'; break;
                    case 'M': r = '[A-Za-z]{'+this.options.monthShort+'}'; break;
                    case 'F': r = '[A-Za-z]+'; break;
                    case 'd': r = '0[1-9]|[12][0-9]|3[01]'; break;
                    case 'j': r = '[12][0-9]|3[01]|[1-9]'; break;
                    case 'D': r = '[A-Za-z]{'+this.options.dayShort+'}'; break;
                    case 'l': r = '[A-Za-z]+'; break;
                    case 'G': 
                    case 'H': 
                    case 'g': 
                    case 'h': r = '[0-9]{1,2}'; break;
                    case 'a': r = '(am|pm)'; break;
                    case 'A': r = '(AM|PM)'; break;
                    case 'i': 
                    case 's': r = '[012345][0-9]'; break;
                    case 'U': r = '-?[0-9]+$'; break;
					case 'T': r = '-?[0-9]+$'; break;
					case 'S': r = '(th|st|nd|rd)'; break;
                    default:  r = null;
                }
                
                if (r) {
                    m = t.match('^'+r);
                    if (m) {
                        a[c] = m[0];
                        t = t.substring(a[c].length);
                    } else {
                        if (this.options.debug && window.console){//if IE need to check for window.console 
                            console.error("ERROR: DateTimePicker Unexpected format at: '"+t+"' expected format character '"+c+"' (pattern '"+r+"')");
                        }
                        return null;
                    }
                } else {
                    t = t.substring(1);
                }
            }
            
            for (c in a) {
                var v = a[c];
                switch(c) {
                    case 'y': d.setFullYear(v < 30 ? 2000 + v.toInt() : 1900 + v.toInt()); break; // assume between 1930 - 2029
                    case 'Y': d.setFullYear(v); break;
                    case 'm':
                    case 'n': d.setMonth(v - 1); break;
                    case 'M': for(var x = 0; x < this.options.months.length; x++){
								if(this.options.months[x].substring(0,this.options.monthShort) === v){
									d.setMonth(x);
								}
							} break;
					case 'F': d.setMonth(this.options.months.indexOf(v)); break;
                    case 'd':
                    case 'j': d.setDate(v); break;
                    case 'G': 
                    case 'H': d.setHours(v); break;
                    case 'g': 
					case 'h': if (a['a'] == 'pm' || a['A'] == 'PM') { d.setHours(v == 12 ? 12 : v.toInt() + 12); } else { d.setHours(v == 12 ? 0 : v.toInt()); } break;
                    case 'i': d.setMinutes(v); break;
                    case 's': d.setSeconds(v); break;
                    case 'U': d = new Date(v.toInt() * 1000); break;
					case 'T': d = new Date(v.toInt()); break;
                }
            }
            
            return d;
        },
        setStyle:function(styles,element){
            var attr = {left: '@px', top: '@px', bottom: '@px', right: '@px', width: '@px', height: '@px', zIndex: '@'};
            for(name in styles){
                var val = styles[name];
                switch(typeof styles[name]){
                    case 'string':
                        if(val == String(Number(val))){//if not NaN
                            val = Math.round(val);
                        }
                        element.style[name] = val;
                        break;
                    case 'number':
                        val = (attr[name] ? attr[name].replace('@', Math.round(val)) : '');
                        if(val){
                            element.style[name] = val;
                        }
                        break;
                    case 'object':
                        break;
                }
            }
        },
        maxZindex: function(){
            var els = document.getElementsByTagName("*");
            var zi = 0;
            for (var i = 0; i < els.length - 1; i++) {
                if(parseInt(els[i].style.zIndex) > zi) {
                    zi = parseInt(els[i].style.zIndex);
                }
            }
            return zi;
        }
    };
	
	if (typeof Array.prototype.indexOf !== 'function') {
        Array.prototype.indexOf = function(obj){
	        for(var i=0; i<this.length; i++){
	            if(this[i]==obj){
	                return i;
	            }
	        }
	        return -1;
	    };
    }

    if (typeof String.prototype.toInt !== 'function') {
        String.prototype.toInt = function(){
            return parseInt(this,10);
        };
    }
    
    var dtp = _datetimePicker.initialise(id,opt);    
    return dtp;
};

$(document).ready(function(){
    console.log("datepicker js is ready");
    var dtp = new DateTimePicker('.demo',{
        pickerClass: 'datetimepicker',
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        daySuffix:["th", "st", "nd", "rd"],
        nextText:'&raquo;',//>>
        prevText:'&laquo;',//<<
        dayShort: 2, // Length of day-abbreviations
        monthShort: 3, // Length of month-abbreviations
        startDay: 1, // Can be 0 (Sunday) through 6 (Saturday).
        timePicker: true, // time picker mode
        timePickerOnly: false,           
        timePickerFormat:24,
        minuteIncrement:15,
        yearPicker: true,
        format: 'm-d-Y @ H:i',
        allowEmpty: false,
        allowInput: false,
        startView: 'month', 
        positionOffset: { x: 0, y: 0 },
        minDate: null,
        maxDate: null,  
        inputOutputFormat: 'T', 
        startDate:null, // The date the picker is to start at. 
        debug: false,
        toggleElementsOnly:true,
        toggleElements: null
    });
    var from = new Date();
    var to = new Date((from.getFullYear()), from.getMonth() + 1, from.getDate() + 1);
    var dte = new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime())); //Get a random date between tomorrow and next 2 months

    var fmtdte = dtp.format(dte, dtp.options.inputOutputFormat); //The date must be in the format set by the inputOuputFormat option
    dtp.setDate(fmtdte); // Pass the formatted string
});
