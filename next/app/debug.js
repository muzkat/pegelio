/**
 * Created by bnz on 7/25/17.
 */
Ext.Component.override({
    initComponent: function () {
        Ext.log('bootstraping ' + this.self.getName());
        var me = this,
            width = me.width,
            height = me.height;

        // If plugins have been added by a subclass's initComponent before calling up to here (or any components
        // that don't have a table view), the processed flag will not have been set, and we must process them again.
        // We could just call getPlugins here however most components don't have them so prevent the extra function call.
        if (me.plugins && !me.plugins.processed) {
            me.plugins = me.constructPlugins();
        }
        me.pluginsInitialized = true;

        // this will properly (ignore or) constrain the configured width/height to their
        // min/max values for consistency.
        if (width != null || height != null) {
            me.setSize(width, height);
        }

        if (me.listeners) {
            me.on(me.listeners);
            me.listeners = null; //change the value to remove any on prototype
        }

        if (me.focusable) {
            me.initFocusable();
        }
    }
});