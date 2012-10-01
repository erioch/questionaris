function Questionaris()
{
    var self = this,
        cell = 49,
        edit = $('#questionari').length > 0;

    /**
     * Generate the grid
     */
    grid( $('.pageviewer:first'), cell );

    /**
     * Check height & width and display extra properties
     */    
    $('#item-type').on('change', function() {
        var width = $('#item-x'),
            height = $('#item-y'),
            text = $('.type-value'),
            multiple = $('.type-multiple');

        $('#item-label').val('');
        text.hide().find('input').val('');
        multiple.hide().find('select').val(1);
        width.is(':disabled') && width.prop('disabled', false);
        height.is(':disabled') && height.prop('disabled', false);

        switch ($(this).val())
        {
            case '1':
                text.show();
                parseInt(width.val())<2 && (width.val(2));
                break;

            case '2':
                text.show();
                parseInt(width.val())<3 && (width.val(3));
                break;

            case '3':
                text.show();
                parseInt(width.val())<4 && (width.val(4));
                parseInt(height.val())<2 && (height.val(2));
                break;

            case '4':
                multiple.show();
                parseInt(width.val())!=1 && (width.val(1));
                parseInt(height.val())!=1 && (height.val(1));
                width.prop('disabled', true);
                height.prop('disabled', true);
                break;

            case '5':
                multiple.show();
                parseInt(width.val())!=1 && (width.val(1));
                parseInt(height.val())!=1 && (height.val(1));
                width.prop('disabled', true);
                height.prop('disabled', true);
                break;

            case '6':
                multiple.show();
                parseInt(width.val())<3 && (width.val(3));
                parseInt(height.val())!=1 && (height.val(1));

            case '0':
            default:
                return;
                break;
        }
    });

    /**
     * Add element to preview area
     */
    $('#add-preview').on('click', function() {
        var type   = $('#item-type').val(),
            text   = $('#item-value').val(),
            label  = $('#item-label').val(),
            size_x = $('#item-x').val(),
            size_y = $('#item-y').val();

        if ( type == 0 ) {
            return;
        }

        // Clear previous items
        $('.preview').children().remove();

        // Add clear link
        $('<a>')
            .text(translate.clear)
            .addClass('clear')
            .on('click', function() {
                var span = $('<span>').html(translate.preview);

                $('.preview')
                    .children()
                        .remove()
                        .end()
                    .append( span );
            })
            .appendTo('.preview');

        // Create item preview
        create_item('.preview', type, text, label, size_x, size_y).addClass('item-preview');
    });

    /**
     * Insert an element on to sheet
     */
    $('#add-item').on('click', function() {
        // If there is a preview, take the item
        if ( $('.item-preview').length > 0 ) {
            var item = $('.item-preview')
                .appendTo('.grid')
                .removeClass('item-preview');

            var span = $('<span>').html(translate.preview);

            $('.preview')
                .children()
                    .remove()
                    .end()
                .append( span );
        }
        else {
            var type   = $('#item-type').val(),
                text   = $('#item-value').val(),
                label  = $('#item-label').val(),
                size_x = $('#item-x').val(),
                size_y = $('#item-y').val();

            if ( type == 0 ) {
                return;
            }

            var item = create_item('.grid', type, text, label, size_x, size_y);
        }

        item
            .addClass('item')
            .hover(function() {
                var $this = $(this);
                $this.css('z-index', 999);
                $('#labelfor-'+$this.attr('id')).stop().fadeIn();
            }, function() {
                var $this = $(this);
                $this.css('z-index', '');
                $('#labelfor-'+$this.attr('id')).stop().fadeOut('fast');
            })
            .draggable({
                revert: 'invalid',
                containment: '.grid',
                cursor: 'move',
                drag: function() {
                    $('#labelfor-'+$(this).attr('id')).stop();
                }
            })
            .children()
                .css('position', 'relative');
       
        var label = $('<div>')
            .attr('id', 'labelfor-'+item.attr('id'))
            .addClass( 'item-label' )
            .css('width', item.data('label').length * 8)
            .text(item.data('label'))
            .appendTo(item);

        // Save item to document we're editing it
        if ( edit ) {
            save_item( item );
        }
    });

    /**
     * Save current document
     */
    $('#save').on('click', function() {
        var items = {};

        $('.item').each(function(i) {
            items[i] = get_item_data( $(this) );
        });

        $.ajax({
            url: Routing.generate('_questionaris_create_tpl', { _locale: locale }),
            type: 'post',
            async: false,
            data: { fields: items, nom: $('#nom').val() },
            success: function( result ) {
                if (!result.status) {
                    msgDlg(result.error, '', 'error');
                    return;
                }
                else {
                    msgDlg(result.message, '', 'no_icon');

                    $('#info_modal_dlg').dialog( 'option', 'buttons', {
                        OK: function() {
                            $(this).dialog( 'close' );

                            if ( result.params.route != '' ) {
                                window.location = Routing.generate(result.params.route, {
                                    _locale: locale
                                });
                            }
                        }
                    });
                }
            }
        });
    });

    /**
     * Save document to a patient
     */
    $('#save-pacient').on('click', function() {
        var items = {};

        $('.item').each(function(i) {
            items[i] = get_item_data( $(this), true );
        });

        $.ajax({
            url: Routing.generate('_questionaris_cursclinic_create', {
                cita: $('#cita').val(),
                _locale: locale
            }),
            type: 'post',
            async: false,
            data: {
                fields: items,
                nom: $('#questionari option:selected').text().trim()
            },
            success: function( result ) {
                if ( !result.status ) {
                    msgDlg(result.error, '', 'error');
                    return;
                }
                else {
                    msgDlg(result.message, '', 'no_icon');

                    $('#info_modal_dlg').dialog( 'option', 'buttons', {
                        OK: function() {
                            $(this).dialog( 'close' );

                            if ( result.params.route != '' ) {
                                window.location = result.params.route;
                            }
                        }
                    });
                }
            }
        });
    });

    /**
     * Edit a patients document
     */
    $('#save-edit').on('click', function() {
        var items = {};

        $('.item').each(function(i) {
            items[i] = get_item_data( $(this), true );
        });

        $.ajax({
            url: Routing.generate('_questionaris_pacients_update', {
                id: $('#questionari').val(),
                _locale: locale
            }),
            type: 'post',
            async: false,
            data: { fields: items },
            success: function( result ) {
                if ( !result.status ) {
                    msgDlg(result.error, '', 'error');
                    return;
                }
                else {
                    msgDlg(result.message, '', 'no_icon');
                    return;
                }
            }
        });
    });

    /**
     * Return
     */
    $('#cancel').on('click', function() {
        window.location = Routing.generate('_questionaris_cursclinic', {
            id  : $('#pacient').val(),
            cita: $('#cita').val(),
            _locale: locale
        });
    });

    /**
     * Add a new sheet to document
     */
    $('#add-page').on('click', function() {
        var page = $('<div>');

        $('<div>')
            .addClass('clear')
            .html('&nbsp;')
                .appendTo('#print_area');

        page
            .addClass('pageviewer')
                .appendTo('#print_area');

        grid( page, cell );
    });

    /**
     * Print current document
     */
    $('#print').on('click', function() {
        var body_content  = $('body').html(),
            print_content = $('#print_area');

        print_content.find('.pageviewer').each(function() {
            var $this = $(this);

            $this.toggleClass('pageviewer', false);
            $this.toggleClass('pagetoprint', true);
        });

        $('body').html( print_content.html() );

        window.print();

        $('body').html( body_content );
    });

    /**
     * Load a template
     */
    $('#load').on('click', function() {
        var qid = $('#questionari').val();

        if ( parseInt(qid) == 0 ) {
            return;
        }

        var route = Routing.generate('_questionaris_get_fields', {
            id: qid,
            _locale: locale
        });

        // Cargamos los items del questionario
        if ( $('.grid').find('.item').length == 0 ) {
            $.getJSON(route, function( items ) {
                if ( items ) {
                    self.load_items( items, true, true );
                }
                else {
                    msgDlg(translate.error_load, '', 'error');
                    return;
                }
            });
        }
        else {
            msgDlg(translate.clean_grid, '', 'warning');

            $('#info_modal_dlg').dialog( 'option', 'buttons', {
                OK: function() {
                    $(this).dialog( 'close' );
                    
                    // Limpiamos el grid de otros 
                    $('.grid').find('.item').remove();

                    $.getJSON(route, function( items ) {
                        if ( items ) {
                            self.load_items( items, true, true );
                        }
                        else {
                            msgDlg(translate.error_load, '', 'error');
                            return;
                        }
                    });
                }
            });
        }
    });

    /**
     * Generate grid
     */
    function grid(e, size) {
        var height = Math.floor(e.height() / size),
            width  = Math.floor(e.width() / size),
            parent = $('<div>');

        parent
            .appendTo(e)
            .addClass('grid')
            .css({
                'width' : (width * size) +1,
                'height': (height * size)+1
            })
            .droppable({
                accept: '.item'
            });

        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                $('<div>')
                    .appendTo(parent)
                    .css({
                        'width' : (size - 1),
                        'height': (size - 1)
                    });
            }
        }
    }

    /**
     * Generate a new id for the new element
     */
    function gen_id(type_id) {
        var id = 0;

        switch (type_id)
        {
            case 1:
                id = $('.grid').find('div[id^="item-label-"]').length;
                break;

            case 2:
                id = $('.grid').find('div[id^="item-input-"]').length;
                break;

            case 3:
                id = $('.grid').find('div[id^="item-area-"]').length;
                break;

            case 4:
                id = $('.grid').find('div[id^="item-check-"]').length;
                break;

            case 5:
                id = $('.grid').find('div[id^="item-radio-"]').length;
                break;

            case 6:
                id = $('.grid').find('div[id^="item-select-"]').length;
                break;

            default:
                break;

        }

        return id++;
    }

    /**
     * @public
     *
     * Load stored items on the document
     */
    this.load_items = function(items, locked, adjust) {

        typeof locked == 'undefined' && (locked = false);
        typeof adjust == 'undefined' && (adjust = false);

        for (i in items)
        {
            var item = $('<div>')
                .appendTo('.grid')
                .data('camp_id', items[i].id)
                .data('label', items[i].label)
                .addClass('item')
                .attr({
                    'id': items[i].camp_type,
                    'style': items[i].camp_config
                })
                .hover(function() {
                    var $this = $(this);
                    $this.css('z-index', 999);
                    $('#labelfor-'+$this.attr('id')).stop().fadeIn();
                }, function() {
                    var $this = $(this);
                    $this.css('z-index', '');
                    $('#labelfor-'+$this.attr('id')).stop().fadeOut('fast');
                });

            // Adjust item top
            if ( adjust )
                item.css('top', parseInt(item.css('top'))-150);

            // Add drag and delete events if editable
            if ( locked === false ) {
                item
                .on('dblclick', function() {
                    edit_item( $(this) );
                })
                .draggable({
                    revert: 'invalid',
                    containment: '.grid',
                    cursor: 'move',
                    drag: function() {
                        $('#labelfor-'+$(this).attr('id')).stop();
                    },
                    start: function() {
                        $(this).data( 'start', $(this).position() );
                    },
                    stop: function() {
                        var $this = $(this);

                        $this.draggable( 'disable' );

                        $.ajax({
                            url: Routing.generate('_questionaris_move_item', {
                                _locale: locale
                            }),
                            type: 'post',
                            async: true,
                            dataType: 'json',
                            data: {
                                id: $this.data('camp_id'),
                                prop: $this.attr('style')
                            },
                            success: function( result ) {
                                if ( !result.status ) {
                                    $this.animate( $this.data( 'start' ), 400 );
                                }

                                $this.draggable( 'enable' );
                            }
                        });
                    }
                });
            }

            var label = $('<div>')
                .attr('id', 'labelfor-'+items[i].camp_type)
                .addClass( 'item-label' )
                .css('width', items[i].camp_type.length * 8)
                .text(items[i].label)
                .appendTo(item);

            switch (guess_type(items[i].camp_type))
            {
                case 'label':
                    generate_label(item, item.outerHeight(), items[i].params)
                    .css('position', 'relative');
                    break;

                case 'input':
                    var stored = items[i].valor_text;

                    (typeof stored=='undefined') && (stored = items[i].params);
                    
                    generate_input(item, item.outerHeight(), stored, !locked)
                    .css('position', 'relative');
                    break;

                case 'area':
                    var stored = items[i].valor_blob;

                    (typeof stored=='undefined') && (stored = items[i].params);

                    generate_area(item, item.outerHeight(), stored, !locked)
                    .css('position', 'relative');
                    break;

                case 'check':
                    var stored  = items[i].valor_text,
                        options = items[i].params.split(';');

                    generate_check(item, item.outerHeight(), item.attr('id'), options.length).css('position', 'relative');

                    var child = get_child( item );

                    $.each(options, function(i, opt) {
                        $(child[i]).val( opt );

                        if ( typeof stored != 'undefined' && $.inArray(opt, stored.split(';')) > -1 )
                            $(child[i]).attr('checked', true);
                    });
                    break;

                case 'radio':
                    var stored  = items[i].valor_text,
                        options = items[i].params.split(';');
                    
                    generate_radio(item, item.outerHeight(), item.attr('id'), options.length).css('position', 'relative');

                    var child = get_child( item );

                    $.each(options, function(i, opt) {
                        $(child[i]).val( opt );

                        if ( opt == stored )
                            $(child[i]).attr('checked', true);
                    });
                    break;

                case 'select':
                    generate_select(item, item.outerHeight(), items[i].params.split(';'))
                    .css('position', 'relative');

                    get_child( item ).val( items[i].valor_text );

                default:
                    break;
            }
        }
    }

    /**
     * Create an item
     */
    function create_item(parent, type, text, label, size_x, size_y) {
        var item = $('<div>').appendTo( parent );

        switch ( parseInt(type) )
        {
            case 1:
                var item_id = 'item-label-'+gen_id(1);

                parseInt(size_x)<1 && (size_x = 1);
                parseInt(size_y)<1 && (size_y = 1);

                generate_label(item, cell*size_y, text);
                break;

            case 2:
                var item_id = 'item-input-'+gen_id(2);
                console.log( item_id );

                parseInt(size_x)<2 && (size_x = 2);
                parseInt(size_y)<1 && (size_y = 1);

                generate_input(item, cell*size_y, text);
                break;

            case 3:
                var item_id = 'item-area-'+gen_id(3);

                parseInt(size_x)<3 && (size_x = 3);
                parseInt(size_y)<2 && (size_y = 2);

                generate_area(item, cell*size_y, text);
                break;

            case 4:
                var item_id  = 'item-check-'+gen_id(4),
                    multiple = parseInt( $('#item-multiple').val() );

                parseInt(size_x)!=1 && (size_x = 1);
                parseInt(size_y)!=1 && (size_y = 1);

                if ( $('#item-h').is(':checked') )
                    size_x = multiple;
                else
                    size_y = multiple;

                generate_check(item, cell*size_y, item_id, multiple);
                get_option_list(item, true);

                break;

            case 5:
                var item_id  = 'item-radio-'+gen_id(5),
                    multiple = parseInt( $('#item-multiple').val() );

                parseInt(size_x)!=1 && (size_x = 1);
                parseInt(size_y)!=1 && (size_y = 1);

                if ( $('#item-h').is(':checked') )
                    size_x = parseInt(multiple);
                else
                    size_y = parseInt(multiple);
                
                generate_radio(item, cell*size_y, item_id, multiple);
                get_option_list(item, true);

                break;

            case 6:
                var item_id = 'item-select-'+gen_id(6);

                parseInt(size_x)<2 && (size_x = 2);
                parseInt(size_y)!=1 && (size_y = 1);

                generate_select(item, cell*size_y);
                get_option_list(item, false);

                break;

            default:
                return;
                break;
        }

        item
            .attr('id', item_id)
            .css({
                'width' : (cell * size_x)-4,
                'height': (cell * size_y)-4,
            })
            .data('label', label=='' ? item_id : label)
            .on('dblclick', function() {
                edit_item( $(this) );
            });

        return item;
    }

    /**
     * Save item to current document
     */
    function save_item(item) {
        $.ajax({
            url: Routing.generate('_questionaris_add_item', { _locale: locale }),
            type: 'post',
            async: true,
            dataType: 'json',
            data: {
                id   : $('#questionari').val(),
                field: get_item_data( item )
            },
            success: function( result ) {
                if ( result.status ) {
                    item
                    .data('camp_id', result.params.campid)
                    .draggable({
                        start: function(event, ui) {
                            $(this).data( 'start', $(this).position() );
                        },
                        stop: function(event, ui) {
                            var $this = $(this);

                            $this.draggable( 'disable' );

                            $.ajax({
                                url: Routing.generate('_questionaris_move_item', {
                                    _locale: locale
                                }),
                                type: 'post',
                                async: true,
                                dataType: 'json',
                                data: {
                                    id: $this.data('camp_id'),
                                    prop: $this.attr('style')
                                },
                                success: function( result ) {
                                    if ( !result.status ) {
                                        $this.animate( $this.data( 'start' ), 400 );
                                    }

                                    $this.draggable( 'enable' );
                                }
                            });
                        }
                    });
                }
                else {
                    item.remove();
                    result.error && msgDlg(result.error, '', 'error');
                }
            }
        });
    }

    /**
     * Get data from all items
     */
    function get_item_data(item, extra_data) {
        typeof extra_data == 'undefined' && (extra_data = false);

        switch (guess_type(item.attr('id')))
        {
            case 'label':
                var params = item.find('label').html();

                if ( extra_data ) {
                    var type  = '',
                        value = '';
                }
                break;
            case 'input':
                var params = item.find('input:text').val();

                if ( extra_data ) {
                    var type  = 'text',
                        value = params;
                }
                break;
            case 'area':
                var params = item.find('textarea').val();

                if ( extra_data ) {
                    var type  = 'blob',
                        value = params;
                }
                break;
            case 'check':
                var params = [];

                if ( extra_data ) {
                    var type  = 'text',
                        value = [];
                }

                item.find('input:checkbox').each(function() {
                    params.push( $(this).val() );

                    if ( extra_data && $(this).is(':checked') ) {
                        value.push( $(this).val() );
                    }
                });
                break;
            case 'radio':
                var params = [];

                if ( extra_data ) {
                    var type  = 'text',
                        value = item.find('input:radio:checked').val();
                        value = typeof value == 'undefined' ? '' : value;
                }

                item.find('input:radio').each(function() {
                    params.push( $(this).val() );
                });
                break;
            case 'select':
                var params = [];

                if ( extra_data ) {
                    type  = 'text',
                    value = item.find('select').val();
                    value = typeof value == 'undefined' ? '' : value;
                }

                item.find('select').children().each(function() {
                    params.push( $(this).val() );
                });
                break;
            default:
                var params = '';
                break;
        }

        data = {
            'id'    : item.attr('id'),
            'config': item.attr('style'),
            'label' : item.data('label'),
            'params': !params.length ? '' : params
        };

        if ( extra_data ) {
            data.type   = type;
            data.value  = !value.length ? '' : value
            data.idcamp = item.data('camp_id')
        }

        return data;
    }

    /**
     * Display a form to store multiple options for
     * checkbox, radiobuttons, select
     */
    function get_option_list(item, input) {
        var multiple = $('#item-multiple').val();

        $('<div>')
            .appendTo('body')
            .attr('id', 'option-list')
            .addClass('dialog')
            .css({
                'padding': '0 10px',
                'text-align': 'center'
            })
            .dialog({
                draggable: true,
                resizable: false,
                height: 300,
                width: 300,
                modal: true,
                close: function() { 
                    $(this).remove();
                    $('a.clear').trigger('click');
                },
                buttons: {
                    Ok: function() {
                        var $this = $(this);

                        $this.find('#option-value').each(function(i) {
                            var opt = $(this).val();

                            if ( !input ) {
                                add_option( item.children(), opt );
                            }
                            else {
                                var children = item.children();
                                $(children[i]).val( opt );
                            }
                        });

                        $this.remove();
                    }
                }
            });

        var table = $('<table>')
                    .addClass('formulario')
                    .appendTo('#option-list');

        for (var i = 0; i < parseInt(multiple); i++) {
            var tr = $('<tr>').appendTo( table );

            $('<td>')
                .attr('width', '70')
                .html(translate.item+'-'+(i+1))
                .appendTo( tr );
            $('<td>')
                .prepend( $('<input type="text">').attr('id', 'option-value') )
                .appendTo( tr );
        }
    }

    /**
     * Edit a single item
     */
    function edit_item(item) {
        var id   = item.attr('id'),
            mult = ['check','radio','select'];

        if ( $.inArray( guess_type(id), mult ) > -1 ) {
            edit_option_list( item );
            return;
        }

        // Create table content
        var table = $('<table>').addClass('formulario').data('item', id);

        // Add row-field to edit item value
        add_tablerow( table, translate.text_value, get_child(item, true) );

        // Add row-field to edit item width
        add_resizerow( table );

        // Create window and append table
        edit_window( table, 'w-edit-item', 200, 290 ).dialog({
            buttons: [{
                // Update item
                text : translate.btn_update,
                click: function() {
                    var $this  = $(this),
                        backup = item.clone();

                    // Get new value
                    var value = $('#option-value').val();

                    // Update item value
                    if ( guess_type(id) == 'label' )
                        get_child(item).html( value.trim() );
                    else
                        get_child(item).val( value );

                    // Resize item
                    resize_item(item, $this.find('#item-x').val(), $this.find('#item-y').val())

                    if ( edit ) {
                        $.ajax({
                            url: Routing.generate('_questionaris_update_item', {
                                _locale: locale
                            }),
                            type: 'post',
                            async: false,
                            dataType: 'json',
                            data: {
                                id : item.data('camp_id'),
                                field: get_item_data( item )
                            },
                            success: function( result ) {
                                if ( !result.status ) {
                                    // Revert changes
                                    item.replaceWith( backup );
                                }
                            }
                        });
                    }

                    $this.dialog( 'close' );
                }
            },
            {
                // Delete item
                text : translate.btn_delete,
                click: function() {
                    var editwin = $(this);

                    msgDlg(translate.confirm, '', 'warning');

                    $('#info_modal_dlg').dialog( 'option', 'buttons', {
                        OK: function() {
                            var warning = $(this);

                            if ( !edit ) {
                                item.remove();
                                warning.dialog( 'close' );
                                editwin.dialog( 'close' );
                            }
                            else {
                                $.ajax({
                                    url: Routing.generate('_questionaris_remove_item', { _locale: locale }),
                                    type: 'post',
                                    async: true,
                                    dataType: 'json',
                                    data: {
                                        id  : $('#questionari').val(),
                                        camp: item.data('camp_id')
                                    },
                                    success: function( result ) {
                                        if ( result.status ) {
                                            item.remove();
                                            warning.dialog( 'close' );
                                            editwin.dialog( 'close' );
                                        }

                                        result.error && msgDlg(result.error, '', 'error');
                                    }
                                });
                            }
                        }
                    });
                }
            }]
        });
    }

    /**
     * Edit a multi-value item
     */
    function edit_option_list(item) {
        // Create table content
        var table = $('<table>')
                    .addClass('formulario')
                    .data('item', item.attr('id'));

        // Add row-field to edit for each item children
        get_child(item).each(function(i) {
            var $this = $(this);

            if ( guess_type(item.attr('id')) == 'select' ) {
                // Add horitzontal resize row
                add_h_resizerow( table );

                $this.children().each(function(i) {
                    add_tablerow( table, translate.item+'-'+(i+1), $(this).val() );
                });

                return;
            }

            add_tablerow( table, translate.item+'-'+(i+1), $this.val() );
        });

        // Create window and append table
        edit_window( table, 'option-list', 300, 300 ).dialog({
            buttons: [{
                text : translate.btn_update,
                click: function() {
                    var $this  = $(this),
                        backup = item.clone(),
                        type   = guess_type( item.attr('id') );

                    if ( type == 'select' ) {
                        var child = get_child( item );

                        child.children().remove();

                        $this.find('#option-value').each(function() {
                            add_option( child, $(this).val() );
                        });

                        h_resize_item( item, $this.find('#item-x').val() );
                    }
                    else {
                        var length = $this.find('#option-value').length;

                        // Remove current children
                        item.find(parse_type(type)).remove();

                        // Generate new empty child(s)
                        if ( type == 'radio' )
                            generate_radio(item, length*cell, item.attr('id'), length);
                        else
                            generate_check(item, length*cell, item.attr('id'), length);

                        var child = get_child( item );

                        // Add value to each child
                        $this.find('#option-value').each(function(i) {
                            $( child[i] ).val( $(this).val() );
                        });

                        // Resize item height with new length
                        v_resize_item( item, length );
                    }

                    if ( edit ) {
                        $.ajax({
                            url: Routing.generate('_questionaris_update_item', {
                                _locale: locale
                            }),
                            type: 'post',
                            async: false,
                            dataType: 'json',
                            data: {
                                id : item.data('camp_id'),
                                field: get_item_data( item )
                            },
                            success: function( result ) {
                                if ( !result.status ) {
                                    // Revert changes
                                    item.replaceWith( backup );
                                }
                            }
                        });
                    }

                    $this.dialog( 'close' );
                }
            },
            {
                text : translate.btn_delete,
                click: function() {
                    var editwin = $(this);

                    msgDlg(translate.confirm, '', 'warning');

                    $('#info_modal_dlg').dialog( 'option', 'buttons', {
                        OK: function() {
                            var warning = $(this);

                            if ( !edit ) {
                                item.remove();
                                warning.dialog( 'close' );
                                editwin.dialog( 'close' );
                            }
                            else {
                                $.ajax({
                                    url: Routing.generate('_questionaris_remove_item', { _locale: locale }),
                                    type: 'post',
                                    async: true,
                                    dataType: 'json',
                                    data: {
                                        id  : $('#questionari').val(),
                                        camp: item.data('camp_id')
                                    },
                                    success: function( result ) {
                                        if ( result.status ) {
                                            item.remove();
                                            warning.dialog( 'close' );
                                            editwin.dialog( 'close' );
                                        }

                                        result.error && msgDlg(result.error, '', 'error');
                                    }
                                });
                            }
                        }
                    });
                }
            }]
        });

        // AFTER window is created, insert an 'Add row' button
        $('<div>')
            .html('&nbsp;')
            .addClass('clear')
            .appendTo('#option-list');

        $('<button>')
            .appendTo('#option-list')
            .addClass('b_verde')
            .text(translate.add)
            .css('margin-top', '10px')
            .on('click', function() {
                add_tablerow( table, translate.item+'-'+table.find('tr').length, '' );
            });
    }

    /**
     * Resize item dimensions
     */
    function resize_item(item, width, height) {
        h_resize_item( item, width );
        v_resize_item( item, height );
    }

    /**
     * Resize item horitzontal length
     */
    function h_resize_item( item, length ) {
        item.css('width', length*cell - 4);
    }

    /**
     * Resize item vertical length
     */
    function v_resize_item( item, length ) {
        item.css('height', length*cell - 4);

        var child = get_child( item );

        child.css(
            'top', Math.ceil((item.outerHeight()/2 - child.outerHeight()/2)-4)
        );

        if ( length == 1 ) {
            child.css('position', 'relative');
        }
    }

    /**
     * Craetes a pop-up to edit an item
     */
    function edit_window(content, id, height, width, item_id) {
        var e = $('<div>')
                .appendTo('body')
                .attr('id', id)
                .addClass('dialog')
                .css('padding', '0 10px')
                .data('item', item_id)
                .dialog({
                    draggable: true,
                    resizable: false,
                    height: height,
                    width: width,
                    modal: true,
                    close: function() { 
                        $(this).remove();
                    }
                });
        
        return e.append( content );
    }

    /**
     * Add a row to the edit item table
     */
    function add_tablerow(table, label, value) {
        var tr = $('<tr>').appendTo( table );

        $('<td>')
            .attr('width', '80')
            .css('vertical-align', 'middle')
            .html( label )
            .appendTo( tr );

        $('<td>')
            .append(
                $('<input type="text">')
                .attr('id', 'option-value')
                .val( value )
            )
            .appendTo( tr );

        // Add a delete option if is a multivalue
        if ( table.find('tr').length > 1 ) {
            tr.find('td:last-child').append(
                $('<a>')
                .text('[x]')
                .addClass('delete')
                .on('click', function() {
                    tr.remove();
                })
            );
        }
    }

    /**
     * Add option to resize the item
     */
    function add_resizerow(table) {
        add_h_resizerow(table);
        add_v_resizerow(table);
    }

    /**
     * Add option to resize item width
     */
    function add_h_resizerow(table) {
        var tr = $('<tr>').appendTo( table ),
            curr_width = $('#'+table.data('item')).outerWidth();

        $('<td>')
            .attr('width', '100')
            .css('vertical-align', 'middle')
            .html( translate.width )
            .appendTo( tr );

        $('<td>')
            .append( $('#item-x').clone().val(curr_width/49) )
            .appendTo( tr );
    }

    /**
     * Add option to resize item height
     */
    function add_v_resizerow(table) {
        var tr = $('<tr>').appendTo( table ),
            curr_height = $('#'+table.data('item')).outerHeight();

        $('<td>')
            .attr('width', '100')
            .css('vertical-align', 'middle')
            .html( translate.height )
            .appendTo( tr );

        $('<td>')
            .append( $('#item-y').clone().val(curr_height/49) )
            .appendTo( tr );
    }

    /**
     * Guess item type from given id
     */
    function guess_type(item_id, parse) {
        typeof parse == 'undefined' && (parse = false);

        if ( !parse )
            return item_id.split('-')[1];
        else
            return parse_type( item_id.split('-')[1] );
    }

    /**
     * Get the child element (or value) of a given item
     */
    function get_child(item, only_value) {
        typeof only_value == 'undefined' && (only_value = false);

        var child = item.find( guess_type(item.attr('id'), true) );

        if ( !only_value )
            return child;
        else {
            if ( guess_type(item.attr('id')) == 'label' )
                return child.html();
            else
                return child.val();
        }
    }

    /**
     * Get HTML item type
     */
    function parse_type(type) {
        switch (type)
        {
            case 'label':
                return 'label';
                break;
            case 'input':
                return 'input:text';
                break;
            case 'area':
                return 'textarea';
                break;
            case 'check':
                return 'input:checkbox';
                break;
            case 'radio':
                return 'input:radio';
                break;
            case 'select':
                return 'select';
                break;
            default:
                return;
                break;
        }
    }

    /**
     * Create label item and appends to given element
     */
    function generate_label(e, height, text) {
        var item = $('<label>')
            .text( text )
            .appendTo( e );

        item.css(
            'top', Math.ceil((height/2 - item.outerHeight()/2)-4)
        );

        item.parent().css('z-index', 0);

        return item;
    }

    /**
     * Create input item and appends to given element
     */
    function generate_input(e, height, text, readonly) {
        var item = $('<input type="text">')
            .attr( 'readonly', readonly )
            .css( 'width', '80%' )
            .val( text )
            .appendTo( e );

        item.css(
            'top', Math.ceil((height/2 - item.outerHeight()/2)-4)
        );

        return item;
    }

    /**
     * Create textarea item and appends to given element
     */
    function generate_area(e, height, text, readonly) {
        var item = $('<textarea>')
            .attr( 'readonly', readonly )
            .css({
                'width' : '80%',
                'height': height*80 / 100,
                'resize': 'none'
            })
            .val( text )
            .appendTo( e );

        item.css(
            'top', Math.ceil((height/2 - item.outerHeight()/2)-2)
        );

        return item;
    }

    /**
     * Create checkbox item and appends to given element
     */
    function generate_check(e, height, name, options) {
        var item = $('<input type="checkbox">')
            .attr( 'name', name )
            .appendTo( e );

        if ( options == 1 ) {
            item.css(
                'top', Math.ceil((height/2 - item.outerHeight()/2)-4)
            );
        }
        else {
            item.css({
                'display': 'block',
                'margin' : ((cell/2 - item.outerHeight()/2)-2)+'px auto 0px'
            });

            for (var i = 1; i < options; i++) {
                item
                    .clone()
                    .css({
                        'display': 'block',
                        'margin' : (cell-item.outerHeight())+'px auto 0px',
                    })
                    .appendTo( e );
            }
        }

        return item;
    }

    /**
     * Create radiobutton item and appends to given element
     */
    function generate_radio(e, height, name, options) {
        var item = $('<input type="radio">')
            .attr( 'name', name )
            .appendTo( e );

        if ( options == 1 ) {
            item.css(
                'top', Math.ceil((height/2 - item.outerHeight()/2)-4)
            );
        }
        else {
            item.css({
                'display': 'block',
                'margin' : ((cell/2 - item.outerHeight()/2)-2)+'px auto 0px'
            });

            for (var i = 1; i < options; i++) {
                item
                    .clone()
                    .css({
                        'display': 'block',
                        'margin' : (cell-item.outerHeight())+'px auto 0px',
                    })
                    .appendTo( e );
            }
        }

        return item;
    }

    /**
     * Generate a select list item and appends to given element
     */
    function generate_select(e, height, options) {
        var item = $('<select>')
            .css( 'width', '80%' )
            .appendTo( e );

        item.css(
            'top', Math.ceil((height/2 - item.outerHeight()/2)-4)
        );

        // Add options
        if ( options ) {
            $.each(options, function(i, opt) {
                add_option( item, opt );
            });
        }

        return item;
    }

    /**
     * Add option to a select item
     */
    function add_option(select, option) {
        // if ( $.trim(option) == '' ) return;

        $('<option>')
        .val(option)
        .html(option)
        .appendTo(select);
    }
}

function item()
{
    var self = this;

    this.create = function(parent, type, text, label, size_x, size_y) {
        var item = $('<div>');

        return item;
    }

    this.child = function() {
        return $(this).children();
    }
}