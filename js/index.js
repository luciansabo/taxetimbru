// 1. http://closure-compiler.appspot.com/home
// 2. http://www.javascriptobfuscator.com/Default.aspx

var taxInfo = new Object();
// ----------------------------------------------------

var jqmReady = $.Deferred();
var pgReady = $.Deferred();

// jqm ready
$(document).bind("mobileinit", jqmReady.resolve);

// phonegap ready
document.addEventListener("deviceready", pgReady.resolve, false);

// all ready :)
$.when(jqmReady, pgReady).then(function () {
    app.onDeviceReady();
    // do your thing
});

var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        // Wait for cordova to load
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        var ref = window.open('http://apache.org', '_blank', 'location=yes');
        ref.addEventListener('loadstart', function(event) { alert('start: ' + event.url); });
        ref.addEventListener('loadstop', function(event) { alert('stop: ' + event.url); });
        ref.addEventListener('loaderror', function(event) { alert('error: ' + event.message); });
        ref.addEventListener('exit', function(event) { alert(event.type); });
        //app.receivedEvent('deviceready');
        this.jqmSetup();
        this.bootstrap();
        this.prepareData();
    },
    // Log on a Received Event
    receivedEvent: function (id) {
        //console.log('Received Event: ' + id);
    },
    prepareData: function () {
        var taxNames = new Array();
        $.getJSON('data/taxe.json', function (jsonData) {
            $.each(jsonData, function (index, tax) {
                taxInfo[tax.nume] = tax;
                taxNames[index] = tax.nume;
            });

            taxNames.sort();

            $.each(taxNames, function (index, nume) {
                $("#nume-taxa").append($('<option></option>').attr("value", nume).text(nume));
            });

            $("#nume-taxa").selectmenu('refresh');
            $("#nume-taxa-menu li a.ui-btn").css('white-space', 'normal');	// activeaza wrap text din lista taxe
        }).fail(function( jqxhr, textStatus, error ) {
            //var err = textStatus + ", " + error;
            //console.log( "Request Failed: " + err );
        });
    },
    showTax: function (taxa) {
        if (taxa == '') {
            taxa = $("#nume-taxa").val();
        }

        var cod = taxInfo[taxa].cod;
        if (cod !== false) {
            if (taxInfo[taxa].campValoare) {
                $val = parseFloat($("#val").val());
                if (isNaN($val)) {
                    $val = 0;
                }

                $("#val-container").fadeIn();
                $("#val").focus();
            } else {
                $("#val-container").fadeOut();
            }
            t = 0;
            eval(cod);
            $('#taxa').html(this.roundTo(t) + ' <span style="font-size: 70%">lei</span>');
            $('#detalii').html('<h4>' + taxInfo[taxa].nume + '</h4>' + taxInfo[taxa].text);
        }
    },
    roundTo: function (value, precision) {
        if (isNaN(value)) {
            return '0';
        }
        precision = typeof precision !== 'undefined' ? precision : 2;
        return parseFloat(value.toFixed(precision)).toString();
    },
    bootstrap: function() {
        // actualizeaza taxa la click pe btn de actualizare
        $("#btn-actualizeaza").click(app.showTax);

        // actualizeaza taxa automat la onchange pe val
        $("#val").change(function () {
            app.showTax('')
        });

        $(".ui-input-text #val").keyup(function () {
                $(this).parent().removeClass('red-border')
                app.showTax('');
            }
        );

        // pt a deschide tastatura soft
        $('#val').click(function (e) {
            $(this).focus();
        });

        $("#btn-reseteaza-filtre").click(function () {
            $("#materie option").prop('selected', false);	// curata materii
            $("#materie").selectmenu('refresh');  // actualizeaza select jquery
            $("#nume-taxa option").prop('selected', false);	// curata select taxe
            $("#nume-taxa").selectmenu('refresh');	// actualizeaza select jquery
            $("#nume-taxa-search").val('');	// curata nume taxa anterioara
            $("#val-container").hide();  // ascunde val
            $("#val").val('');	// curata valoare
            $("#detalii").html('');
            $("#taxa").html('<span style="font-size: 60%" onclick=\'$("#nume-taxa").selectmenu("open")\'>alegeți taxa</span>');
        });

        // filtreaza si sorteaza taxe cand deschidem select-ul
        $("#nume-taxa-button").click(function () {
            $("#nume-taxa-menu").filterable('update');
        });

        $("#nume-taxa").change(function () {
            app.showTax($(this).val());

            if (!$("#val").val()) {
                $("#val").parent().addClass('red-border');
            }
        });
    },
    jqmSetup: function() {
        // jqm
        // creare filtru
        $.mobile.filterable.prototype._filterItems = function (val) {
            var nrMaterii = $("#materie-menu li a.ui-checkbox-on").length;
            var idx, callback, length, dst,
                show = [],
                hide = [],
                opts = this.options,
                filterItems = this._getFilterableItems();

            //if (val != null) {
            callback = opts.filterCallback || defaultFilterCallback;
            length = filterItems.length;

            // Partition the items into those to be hidden and those to be shown
            // step 1 - first put items that *begins with*
            for (idx = 0; idx < length; idx++) {
                if (val == "" || $(filterItems[idx]).text().toLowerCase().indexOf(val) === 0) {
                    var materie = taxInfo[$(filterItems[idx]).text()].categorie;
                    if (nrMaterii == 0 || jQuery.inArray(materie, $("#materie").val()) !== -1) {
                        dst = show;
                    } else {
                        dst = hide;
                    }
                } else {
                    dst = hide;
                }
                dst.push(filterItems[idx]);
            }

            // step 2 - contains
            var hidden = hide;
            length = hidden.length;
            for (idx = 0; idx < length; idx++) {
                if (val == "" || $(hidden[idx]).text().toLowerCase().indexOf(val) !== -1) {
                    var materie = taxInfo[$(hidden[idx]).text()].categorie;
                    if (nrMaterii == 0 || jQuery.inArray(materie, $("#materie").val()) !== -1) {
                        show.push(hidden[idx]);
                        hide.splice(idx, 1);    // remove current index from hide array
                    }
                }
            }
            // }

            // If nothing is hidden, then the decision whether to hide or show the items
            // is based on the "filterReveal" option.
            if (hide.length === 0) {
                filterItems[ opts.filterReveal ? "addClass" : "removeClass" ]("ui-screen-hidden");
            } else {
                $(hide).addClass("ui-screen-hidden");
                $(show).removeClass("ui-screen-hidden");
            }

            // reorder visible
            list = $(this.element);
            list.html('');	// temporarily strip html
            // add visible items first in the correct order
            for (idx = 0; idx < show.length; idx++) {
                list.append(show[idx]);
            }

            // add hidden items last in the correct order
            for (idx = 0; idx < hide.length; idx++) {
                list.append(hide[idx]);
            }

            // apparently, we do not need to refresh it
            //this._refreshChildWidget();
        };

        $.mobile.filterable.prototype.update = function () {
            this._filterItems("");
        };

        $.mobile.document
            // "nume-taxa-menu" is the ID generated for the listview when it is created
            // by the custom selectmenu plugin. Upon creation of the listview widget we
            // want to prepend an input field to the list to be used for a filter.
            .on("listviewcreate", "#nume-taxa-menu", function (e) {

                var input,
                    listbox = $("#nume-taxa-listbox"),
                    form = listbox.jqmData("filter-form"),
                    listview = $(e.target);
                // We store the generated form in a variable attached to the popup so we
                // avoid creating a second form/input field when the listview is
                // destroyed/rebuilt during a refresh.
                if (!form) {
                    input = $("<input data-type='search' id='nume-taxa-search' placeholder='Numele taxei (fara diacritice)'></input>");
                    form = $("<form></form>").append(input);
                    input.textinput();
                    $("#nume-taxa-listbox")
                        .prepend(form)
                        .jqmData("filter-form", form);
                }

                $("ul#nume-taxa-menu li").remove(':first-child');
                // Instantiate a filterable widget on the newly created listview and
                // indicate that the generated input is to be used for the filtering.
                listview.filterable({input: input});
            })
            // put focus on search ?
            .on("pageshow", "#nume-taxa-dialog", function (e) {
                $("#nume-taxa-search").focus();
                //$("#nume-taxa-menu").filterable('update');
            })
            // The custom select list may show up as either a popup or a dialog,
            // depending how much vertical room there is on the screen. If it shows up
            // as a dialog, then the form containing the filter input field must be
            // transferred to the dialog so that the user can continue to use it for
            // filtering list items.
            //
            // After the dialog is closed, the form containing the filter input is
            // transferred back into the popup.
            .on("pagebeforeshow pagehide", "#nume-taxa-dialog", function (e) {

                var form = $("#nume-taxa-listbox").jqmData("filter-form"),
                    placeInDialog = ( e.type === "pagebeforeshow" ),
                    destination = placeInDialog ? $(e.target).find(".ui-content") : $("#nume-taxa-listbox");
                form
                    .find("input")
                    // Turn off the "inset" option when the filter input is inside a dialog
                    // and turn it back on when it is placed back inside the popup, because
                    // it looks better that way.
                    .textinput("option", "inset", !placeInDialog)
                    .end()
                    .prependTo(destination);

                $("#nume-taxa-search").val('');
                $("#val").focus();
            });
    }
};


function pretentii() {
    if ($val > 0 && $val <= 500) {
        var t;
        t = $val * 0.08;
        if (t < 20) {
            t = 20;
        }
        return t;
    }
    else if ($val > 500 && $val <= 5000) {
        return ($val - 500) * 0.07 + 40;
    }
    else if ($val > 5000 && $val <= 25000) {
        return ($val - 5000) * 0.05 + 355;
    }
    else if ($val > 25000 && $val <= 50000) {
        return ($val - 25000) * 0.03 + 1355;
    }
    else if ($val > 50000 && $val <= 250000) {
        return ($val - 50000) * 0.02 + 2105;
    }
    else if ($val > 250000) {
        return ($val - 250000) * 0.01 + 6105;
    }
}