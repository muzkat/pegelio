Ext.define('MuzkatFinance.GridController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.accountGridController',

    control: {
        '*': {
            collapsebody: 'collapsebody',
            expandbody: 'expandbody'
        }
    },

    collapsebody: function (rowNode, record, expandRow, eOpts) {
        Ext.Msg.alert('Collapse', 'The Add button was clicked');
    },

    expandbody: function (rowNode, record, expandRow, eOpts) {
        Ext.Msg.alert('Expand', 'The Add button was clicked');
    }
});

Ext.define('MuzkatFinance.WatersGrid', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.watersGrid',
    store: Ext.create('Ext.data.BufferedStore', {
        proxy: {
            type: 'ajax',
            url: 'http://api.sourcloud.com/waters',
            reader: {
                type: 'json',
                rootProperty: 'items',
                totalProperty: 'totalCount'
            }
        },
        autoLoad: true,
        pageSize: 250
    }),
    columns: [
        {text: 'WATERSHORT', dataIndex: 'waterShort', flex: 1}
    ],
    header: false,
    hideHeaders: true,
    listeners: {
        select: function (rowModel, record, eOpts) {
            if (rowModel.view) {
                var view = rowModel.view.up('mainView');
                var arr = view.query('#stationsGrid');
                if (arr.length === 1) {
                    arr[0].refreshStoreData(record.get('waterShort'));
                }
            }
        }
    },
    initComponent: function () {
        this.callParent(arguments);
    }
});

Ext.define('MuzkatFinance.stations.Grid', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.stationsGrid',
    itemId: 'stationsGrid',
    header: false,
    hideHeaders: true,
    viewModel: {
        stores: {
            stationStore: {
                data: []
            }
        }
    },
    bind: {
        store: '{stationStore}'
    },
    columns: [
        {text: 'UUID', dataIndex: 'uuid', hidden: true},
        {text: 'SHORTNAME', dataIndex: 'shortname', hidden: true},
        {text: 'LONGNAME', dataIndex: 'longname', flex: 2},
        {text: 'AGENCY', dataIndex: 'agency', flex: 3},
        {text: 'KM', dataIndex: 'km', hidden: true},
        {text: 'WATERSHORT', dataIndex: 'waterShort', hidden: true}
    ],

    listeners: {
        select: function (rowModel, record, eOpts) {
            if (rowModel.view) {
                var view = rowModel.view.up('mainView');
                var arr = view.query('#stationContainer');
                if (arr.length === 1) {
                    arr[0].updateActiveStation(record.get('uuid'));
                }
            }
        }
    },

    initComponent: function () {
        this.callParent(arguments);
    },
    refreshStoreData: function (waterName) {
        var me = this;
        Ext.Ajax.request({
            method: 'GET',
            url: 'http://api.sourcloud.com/stationen' + '/' + waterName,
            success: function (response, opts) {
                me.getViewModel().getStore('stationStore').removeAll();
                var obj = Ext.decode(response.responseText, true);
                if (obj !== null && obj.items && Ext.isArray(obj.items) && obj.items.length > 0) {
                    me.getViewModel().getStore('stationStore').loadData(obj.items);
                }
            },

            failure: function (response, opts) {
                Ext.log({dump: 'Error while fetching the stationsByWater'});
            }
        });
    }
});

Ext.define('MuzkatFinance.station.Container', {
    extend: 'Ext.container.Container',
    alias: 'widget.stationContainer',
    itemId: 'stationContainer',
    viewModel: {
        data: {
            stationObj: null,
            timeSeries: []
        },
        stores: {
            timeSeriesStore: {
                data: '{timeSeries}'
            }
        }
    },

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    items: [{
        xtype: 'container',
        flex:1,
        layout: {
            type: 'hbox',
            align: 'stretch'
        },
        items: [{
            xtype: 'container',
            layout: 'vbox',
            flex:1,
            items: [{
                xtype: 'box',
                bind: {
                    html: '{stationObj.longname} | {stationObj.number}'
                }
            }, {
                xtype: 'box',
                bind: {
                    html: '{stationObj.agency} | {stationObj.km}'
                }
            }, {
                xtype: 'box',
                bind: {
                    html: '{stationObj.water.longname}'
                }
            }]
        },{
            xtype: 'muzkatMap',
            flex:2
        }]
    }, {
        xtype: 'container',
        height: 300,
        layout: 'fit',
        items: [{
            xtype: 'grid',
            forceFit:true,
            header: false,
            hideHeaders: true,
            columns: [{
                text: 'Messreihe',
                dataIndex: 'longname',
                flex: 1
            }],
            bind: {
                store: '{timeSeriesStore}'
            }
        }]
    }],

    initComponent: function () {
        this.callParent(arguments);
    },
    updateActiveStation: function (uuid) {
        var me = this;
        Ext.Ajax.request({
            method: 'GET',
            url: 'http://api.sourcloud.com/stationen' + '/' + uuid + '/data',
            success: function (response, opts) {
                me.getViewModel().set('stationObj', {});
                me.getViewModel().set('timeSeries', []);
                var obj = Ext.decode(response.responseText, true);
                if (obj !== null && Ext.isObject(obj)) {
                    me.getViewModel().set('stationObj', obj);
                    if (obj.timeseries && Ext.isArray(obj.timeseries) && obj.timeseries.length > 0) {
                        me.getViewModel().set('timeSeries', obj.timeseries);

                        var columnStrings = Object.keys(obj.timeseries[0]);
                        var columns = [];
                        Ext.Array.each(columnStrings, function (string) {
                            columns.push({
                                dataIndex: string,
                                flex: 1
                            });
                        });
                        me.down('grid').reconfigure(null, columns);
                    }
                    if (obj.latitude && obj.longitude) {
                        me.query('muzkatOsmMap')[0].changeView(obj.latitude, obj.longitude);
                        me.query('muzkatOsmMap')[0].setPinOnMap(obj.latitude, obj.longitude);
                    }
                }
            },

            failure: function (response, opts) {
                Ext.log({dump: 'Error while fetching the stationsByWater'});
            }
        });
    }
});

Ext.define('MuzkatFinance.Main.ColumnWrapper', {
    extend: 'Ext.container.Container',
    alias: 'widget.mainViewColumnWrapper',
    viewModel:{
        data: {
            header: ''
        }
    },
    header: false,
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    initComponent: function () {
        this.addedCmp.flex = 9;

        this.defaults = {
            padding: '10 10 10 10'
        };

        this.items = [{
            xtype: 'box',
            cls: 'mainViewColumnHeader',
            bind: {
                html: '{header}'
            }
        }, this.addedCmp];

        this.callParent(arguments);
        this.getViewModel().set('header', this.headerName);
    }
});

Ext.define('MuzkatFinance.Main', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.mainView',
    title: 'Main Viewport View',
    header: false,
    layout: {
        type: 'hbox',
        align: 'stretch'
    },

    defaults: {
        xtype: 'mainViewColumnWrapper'
    },

    items: [{
        addedCmp: {
            xtype: 'watersGrid'
        },
        headerName: 'Gewässer',
        flex: 1
    }, {
        addedCmp: {
            xtype: 'stationsGrid'
        },
        headerName: 'Stationen',
        flex: 2
    }, {
        addedCmp: {xtype: 'stationContainer'},
        headerName: 'Messpunkt',
        flex: 5
    }]
});


Ext.application({
    name: 'MuzkatFinance',
    mainView: 'MuzkatFinance.Main',
    launch: function () {
        Ext.log('MuzkatFinance booted!');
    }
});

