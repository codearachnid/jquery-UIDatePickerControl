/**
 * jQuery UIDatePickerControl v0.9
 *
 * A simple plugin to organize events in a daily view and positioned 
 * in relationship to each other.
 * 
 * @author Timothy Wood @codearachnid <tim@imaginesimplicity.com>
 * @license GPLV3
 * @requires jquery.nearest, jquery.event.swipe, jquery.event.move, jquery.dateFormat
 * 
 */

;(function ( $, window, document, undefined ) {

    var pluginName = "UIDatePickerControl",
        defaults = {
            debug: false,
            itemHeight: '50px',
            visibleRange: 5,
            fullRange: 90,
            selectedClass: 'active'
        };

    // plugin constructor
    function Plugin ( element, options ) {
        this.element = element;
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this._debug = this.settings.debug;
        this._selected = new Date();
        this.init();
    }

    Plugin.prototype = {
        init: function () {
            // when in debug mode
            if( this._debug ) {
                console.time( this._name + "-init");
                console.log(this._name + ".init()");
            }

            self=this;

            self.getDateTime();
            self.controlSetup();
            self.setDateTime();
            self.swipeHandler();
            
            $(self.element).find('.datetime').on('change',function(){
                self.update();
            });

            // stop debug timer
            if( this._debug )
                console.timeEnd(this._name + "-init");
        },
        update: function() {
            // when in debug mode
            if( this._debug ) {
                console.time( this._name + "-update");
                console.log(this._name + ".update()");
            }

            self.getDateTime();
            self.dateControl();
            self.setDateTime();
            self.swipeHandler();

            // stop debug timer
            if( this._debug )
                console.timeEnd(this._name + "-update");
        },
        swipeHandler: function(){
            var nearestElement = 0, selected, itemsElement, availableHeight, originalPosition = {
                top: 0,
                left: 0
            };
            self = this;
            $( this.element ).find('.items')
            .on( "swipeup", function(e){

            })
            .on('movestart', function(e) {
                // If the movestart heads off in a sideways direction, 
                // prevent it so that the browser scrolls vertically.
                if ((e.distX > e.distY && e.distX > -e.distY) ||
                    (e.distX < e.distY && e.distX < -e.distY)){
                    e.preventDefault();
                    return;
                }

                itemsElement = $(e.target).parent();
                originalPosition = itemsElement.offset();
                availableHeight = itemsElement.outerHeight();
                selected = $(e.target).parents('.control').find('.selected');
                itemsElement.children().removeClass( self.settings.selectedClass );

                // To allow the slide to keep step with the finger,
                // temporarily disable transitions.
                $(this).addClass('notransition');
            })
            .on('move', function(e) {
                
                var distance = originalPosition.top + e.distY;
                nearestElement = 0;

                
                if ( (e.distY < 0) || (e.distY > 0) ) {
                    nearestElement = (e.distY < 0) ? -1 : -2;

                    // slide if we haven't reached the limits of the available list
                    if((selected.offset().top + selected.outerHeight() <= parseInt(distance) + parseInt( availableHeight )) &&
                       (selected.offset().top >= parseInt(distance))) {

                        // set items offset based on slide position of finger
                        itemsElement.offset({ top: distance });
                    }
                }
            })
            .on('moveend', function(e) {

                // remove css transition blocks
                $(this).removeClass('notransition');

                itemsElement.children().removeClass( self.settings.selectedClass );

                touching = selected.touching();
                intendedElement = $(touching[ touching.length + nearestElement ]);

                // snap item with selected bar
                itemsElement.animate({ 
                    top: ( selected.offset().top - intendedElement.offset().top ) + itemsElement.position().top 
                }, {
                    complete: function(){
                        // get changed value
                        changedValue = intendedElement.addClass( self.settings.selectedClass ).attr('data-value');
                        control = itemsElement.parent();

                        // look at the parent control to determine which date param to update
                        switch( control.attr('data-type') ) {
                            case "date":
                                pattern = /(\d{4})-(\d{2})-(\d{2})/;
                                dateArray = pattern.exec(changedValue); 
                                self._selected.setFullYear( (+dateArray[1]) );
                                self._selected.setMonth( (+dateArray[2]) -1 ); // offset date input
                                self._selected.setDate( (+dateArray[3]) );
                                self.dateControl( intendedElement );
                                break;
                            case "hour":
                                mode = control.attr('data-mode');
                                mode = typeof mode !== 'undefined' && mode !== false ? parseInt( control.attr('data-mode') ) : 24;
                                if(mode == 24){
                                    self._selected.setHours(changedValue);
                                } else {
                                    currentHour = self._selected.getHours();
                                    if( currentHour <= 12 ) {
                                        // AM
                                        self._selected.setHours(changedValue);
                                    } else {
                                        // PM    
                                        self._selected.setHours( parseInt(changedValue) + 12);
                                    }
                                }
                                break;
                            case 'minute':
                                self._selected.setMinutes(changedValue);
                                break;
                            case "meridiem":
                                currentHour = self._selected.getHours();
                                if( changedValue == 'AM' ){
                                    self._selected.setHours(currentHour - 12);
                                } else{
                                    self._selected.setHours(currentHour + 12);
                                }
                                break;
                        }
                        self.saveDateTime();
                    }
                });

            });
        },
        controlSetup: function(){
            // when in debug mode
            if( this._debug ) {
                console.time( this._name + "-controlSetup");
                console.log(this._name + ".controlSetup()");
            }

            self = this;

            $(this.element).find('.control').each(function(i, control){
                control = $(control);
                dom = [];
                items = [];
                switch( control.attr('data-type') ) {
                    case "date":
                        self.dateControl();
                        break;
                    case "hour":
                        mode = control.attr('data-mode');
                        mode = typeof mode !== 'undefined' && mode !== false ? parseInt( control.attr('data-mode') ) : 24;
                        for( var i = 0; i<mode; i++){
                            items.push( self.option( i+1 ) );
                        }
                        break;
                    case 'minute':
                        increment = control.attr('data-increment');
                        increment = typeof increment !== 'undefined' && increment !== false ? parseInt( control.attr('data-increment') ) : 1;
                        minutesInDay = 60 / parseInt(increment);
                        for( var i = 0; i<minutesInDay; i++){
                            value = i == 0 ? '00' : i * increment;
                            items.push( self.option( value ) );
                        }
                        break;
                    case "meridiem":
                        items = items.concat([
                            self.option('AM'),
                            self.option('PM') 
                            ]);
                        break;
                }

                // add selected overlay if not found
                if ( control.find('.selected').length == 0)
                    dom.push( $('<div>').addClass('selected') );

                // add items if they exist
                if( items.length > 0 )
                    dom.push( $('<div>').addClass('items').append( items ) );

                // if new dom elements exists punch to the control
                if( dom.length > 0 )
                    control.append( dom );

                // fix the improper order of control's children
                if( control.find('.items').index() < control.find('.selected').index() )
                    control.append(control.children().get().reverse());

            });

            // stop debug timer
            if( this._debug )
                console.timeEnd(this._name + "-controlSetup");
        },
        dateControl: function( intendedElement ){
            intendedElement = intendedElement || false;
            control = $(this.element).find('.control[data-type=date]');
            var items = [];
            // update around date element
            if( intendedElement ){
                itemsElement = control.find('.items');

                // setup indexes for selected element
                intendedElementIndex = intendedElement.index();
                directionLength = Math.round( this.settings.visibleRange / 2 );

                // setup wrapping date ranges
                var firstDateRange = Date.prototype.getDateRange(this._selected.addDays( - Math.round( this.settings.fullRange / 2 ) - directionLength ), this._selected.addDays(-1));
                prependItems = this.dateOptions( firstDateRange );
                var secondDateRange = Date.prototype.getDateRange(this._selected.addDays(1), this._selected.addDays( Math.round( this.settings.fullRange / 2 ) + directionLength ));
                appendItems = this.dateOptions( secondDateRange );

                // trim current date range
                control.find('.item:gt(' + ( intendedElementIndex + directionLength ) + ')').remove();
                control.find('.item:lt(' + ( intendedElementIndex - directionLength ) + ')').remove();

                // wrap existing date range with new ranges
                itemsElement.prepend(prependItems).append( appendItems );

                // fix adjusted offset
                itemsElement.offset({
                    top: ( control.find('.selected').offset().top - intendedElement.offset().top ) + itemsElement.offset().top
                });
                
            } else {
                var dateRange = Date.prototype.getDateRange(this._selected.addDays( - Math.round( this.settings.fullRange / 2 )), this._selected.addDays(Math.round( this.settings.fullRange / 2 )));
                items = this.dateOptions( dateRange );    
                // add new date control items
                if( control.find('.items').length == 0){
                    control.append( $('<div>').addClass('items').append( items ) );
                // flush and add new items
                } else {
                    control.find('.items').html('').append( items );
                }
            }
        },
        dateOptions: function( dateRange ){
            var items = [];
            for( var i = 0; i<dateRange.length; i++){
                label = $.format.date( dateRange[ i ], "ddd MMM D" );
                value = $.format.date( dateRange[ i ], "yyyy-MM-dd" );
                items.push( this.option( value, label ) );
            }
            return items;
        },
        option: function( value, label ){
            label = label || value;
            return $('<div>').addClass('item').attr('data-value', value ).text( label );
        },
        setDateTime: function(){
            control = {};

            // set minutes
            control.minute = $(this.element).find('.control[data-type=minute]');
            minutesInDay = this.padNumber( 
                parseInt( control.minute.attr('data-increment') ) * 
                Math.round( 
                    this._selected.getMinutes() / parseInt( control.minute.attr('data-increment') 
                    ) )
                , 2 );
            // check if we're nearing end of hour and advance an hour
            if( minutesInDay == '60' ){
                minutesInDay = '00';
                this._selected.setHours( this._selected.getHours() + 1 );
            }
            control.minute.find('.items').offset({
                top: control.minute.find('.selected').offset().top - control.minute.find('.item[data-value=' + minutesInDay + ']').addClass( this.settings.selectedClass ).position().top
            });

            // set hours
            control.hour = $(this.element).find('.control[data-type=hour]');
            if( this._selected.getHours() > 12 ){
                hoursInDay = this._selected.getHours() - 12;
                meridiemInDay = 'PM';
            } else {
                hoursInDay = this._selected.getHours();
                meridiemInDay = 'AM';
            }
            control.hour.find('.items').offset({
                top: control.hour.find('.selected').offset().top - control.hour.find('.item[data-value=' + hoursInDay + ']').addClass( this.settings.selectedClass ).position().top
            });

            // set meridiem
            control.meridiem = $(this.element).find('.control[data-type=meridiem]');
            control.meridiem.find('.items').offset({
                top: control.meridiem.find('.selected').offset().top - control.meridiem.find('.item[data-value=' + meridiemInDay + ']').addClass( this.settings.selectedClass ).position().top
            });

            // set date
            control.date = $(this.element).find('.control[data-type=date]');
            currentDate = 
                this._selected.getFullYear() + "-" + 
                this.padNumber( this._selected.getMonth()+1, 2 )  + "-" + 
                this.padNumber( this._selected.getDate(), 2 );
            control.date.find('.items').offset({
                top: control.date.find('.selected').offset().top - control.date.find('.item[data-value=' + currentDate + ']').addClass( this.settings.selectedClass ).position().top
            });

        },
        getDateTime: function(){
            dateTime = $(this.element).find('.datetime').val();
            if (dateTime == false || typeof dateTime == 'undefined')
                return false;
            pattern = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
            dateArray = pattern.exec(dateTime); 
            this._selected = new Date(
                (+dateArray[1]),
                (+dateArray[2])-1,
                (+dateArray[3]),
                (+dateArray[4]),
                (+dateArray[5]),
                (+dateArray[6])
            );
            console.log( "Get date/time: " + this._selected );
        },
        saveDateTime: function(){
            // format selected date object for serialized input
            dateTime = 
                this._selected.getFullYear() + "-" + 
                this.padNumber( this._selected.getMonth() + 1, 2 )  + "-" + 
                this.padNumber( this._selected.getDate(), 2 ) + " " + 
                this.padNumber( this._selected.getHours(), 2 ) + ":" + 
                this.padNumber( this._selected.getMinutes(), 2 ) + ":00";
            $(this.element).find('.datetime').val( dateTime );
            console.log( "Set date/time: " + dateTime );
        },
        padNumber: function( n, width, z ){
            z = z || '0';
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        }
    };

    Date.prototype.addDays = function(days) {
        var element = new Date( this.valueOf() );
        element.setDate( element.getDate() + days );
        return element;
    };
    Date.prototype.getDateRange = function(start, end, interval) {
        interval = interval || 1;
        var dateRange = [], start = new Date(start), end = new Date(end);
        while (start <= end) {
            dateRange.push(start);
            start = Date.prototype.addDays.call(start, interval);
        }
        return dateRange;
    };

    $.fn[ pluginName ] = function ( options ) {
        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            return this.each(function () {

                if (!$.data(this, 'plugin_' + pluginName)) {

                    $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
                }
            });

        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            var returns;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);

                if (instance instanceof Plugin && typeof instance[options] === 'function') {

                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }

                if (options === 'destroy') {
                  $.data(this, 'plugin_' + pluginName, null);
                }
            });

            return returns !== undefined ? returns : this;
        }
    };

})( jQuery, window, document );
