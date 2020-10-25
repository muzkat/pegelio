/**
 * Created by bnz on 8/6/17.
 */


Ext.define('MuzkatFinance.muzkatMap.maps.baseMap', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.muzkatBaseMap',

    region: 'center',
    layout: 'fit',
    title: 'Map',
    header: false

});

Ext.define('MuzkatFinance.muzkatMap.osm', {
    extend: 'MuzkatFinance.muzkatMap.maps.baseMap',
    alias: 'widget.muzkatOsmMap',

    lat: 52.3,
    lng: 13.1,

    mapMarkers: new Ext.util.HashMap(),

    listeners: {
        afterrender: function (cmp) {
            var osmLayer = new ol.layer.Tile({
                    source: new ol.source.OSM()
                }),
                view = new ol.View({
                    center: ol.proj.transform([cmp.lng, cmp.lat], 'EPSG:4326', 'EPSG:3857'),
                    zoom: 11
                });

            cmp.map = new ol.Map({
                target: cmp.body.dom.id,
                renderer: 'canvas',
                // layers: [osmLayer, vectorLayer],
                layers: [osmLayer],
                view: view
            });

            Ext.defer(function () {
                cmp.map.updateSize();
            }, 300);

        },
        resize: function () {
            this.map.updateSize();
        }
    },
    /*,
     dockedItems: [{
     xtype: 'toolbar',
     dock: 'bottom',
     items: [{
     iconCls: 'x-fa fa-cog',
     }]
     }]*/
    changeView: function (lat, long) {
        this.map.getView().setCenter(ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857'));
        // this.map.getView().setZoom(5);
    },

    setPinOnMap: function (lat, long) {
        var self = this;
        var latLong = ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857');
        var key = lat + long;


        if (self.mapMarkers.get(key) !== undefined && self.mapMarkers.get(key) !== null) {
            console.log("moove")
            // self.iconGeometry.setCoordinates(evt.coordinate);
            //or create another pin
        } else {
            self.mapMarkers.add(key, null);
            self.iconGeometry = new ol.geom.Point(latLong);
            var iconFeature = new ol.Feature({
                geometry: self.iconGeometry,
                name: 'Null Island',
                population: 4000,
                rainfall: 500
            });
            var iconStyle = new ol.style.Style({
                image: new ol.style.Icon(({
                    anchor: [0.5, 46],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: 'http://openlayers.org/en/v3.9.0/examples/data/icon.png'
                }))
            });

            iconFeature.setStyle(iconStyle);

            var vectorSource = new ol.source.Vector({
                features: [iconFeature]
            });

            self.mapMarkers.add(key, new ol.layer.Vector({
                source: vectorSource
            }));

            self.map.addLayer(self.mapMarkers.get(key));
        }


    }
});


Ext.define('MuzkatFinance.muzkatMap.muzkatMap', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.muzkatMap',

    layout: 'fit',
    title: 'ExtJs Universal Map component by muzkat',
    header: false,
    items: [
        {xtype: 'muzkatOsmMap'}
    ]

});