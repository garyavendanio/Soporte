(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('utilities')) :
    typeof define === 'function' && define.amd ? define('mytagsnotification', ['utilities'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.mytagsNotification = factory(global.mytags.util));
}(this, (function (utilities) { 'use strict';

    var Container = {

        props: {
            container: Boolean
        },

        data: {
            container: true
        },

        computed: {

            container: function(ref) {
                var container = ref.container;

                return container === true && this.$container || container && utilities.$(container);
            }

        }

    };

    var obj;

    var Component = {

        mixins: [Container],

        functional: true,

        args: ['message', 'status'],

        data: {
            message: '',
            status: '',
            timeout: 5000,
            group: null,
            pos: 'top-center',
            clsContainer: 'x-notification',
            clsClose: 'x-notification-close',
            clsMsg: 'x-notification-message'
        },

        install: install,

        computed: {

            marginProp: function(ref) {
                var pos = ref.pos;

                return ("margin" + (utilities.startsWith(pos, 'top') ? 'Top' : 'Bottom'));
            },

            startProps: function() {
                var obj;

                return ( obj = {opacity: 0}, obj[this.marginProp] = -this.$el.offsetHeight, obj );
            }

        },

        created: function() {

            var container = utilities.$(("." + (this.clsContainer) + "-" + (this.pos)), this.container)
                || utilities.append(this.container, ("<div class=\"" + (this.clsContainer) + " " + (this.clsContainer) + "-" + (this.pos) + "\" style=\"display: block\"></div>"));

            this.$mount(utilities.append(container,
                ("<div class=\"" + (this.clsMsg) + (this.status ? (" " + (this.clsMsg) + "-" + (this.status)) : '') + "\"> <a href class=\"" + (this.clsClose) + "\" data-x-close></a> <div>" + (this.message) + "</div> </div>")
            ));

        },

        connected: function() {
            var this$1$1 = this;
            var obj;


            var margin = utilities.toFloat(utilities.css(this.$el, this.marginProp));
            utilities.Transition.start(
                utilities.css(this.$el, this.startProps),
                ( obj = {opacity: 1}, obj[this.marginProp] = margin, obj )
            ).then(function () {
                if (this$1$1.timeout) {
                    this$1$1.timer = setTimeout(this$1$1.close, this$1$1.timeout);
                }
            });

        },

        events: ( obj = {

            click: function(e) {
                if (utilities.closest(e.target, 'a[href="#"],a[href=""]')) {
                    e.preventDefault();
                }
                this.close();
            }

        }, obj[utilities.pointerEnter] = function () {
                if (this.timer) {
                    clearTimeout(this.timer);
                }
            }, obj[utilities.pointerLeave] = function () {
                if (this.timeout) {
                    this.timer = setTimeout(this.close, this.timeout);
                }
            }, obj ),

        methods: {

            close: function(immediate) {
                var this$1$1 = this;


                var removeFn = function (el) {

                    var container = utilities.parent(el);

                    utilities.trigger(el, 'close', [this$1$1]);
                    utilities.remove(el);

                    if (container && !container.hasChildNodes()) {
                        utilities.remove(container);
                    }

                };

                if (this.timer) {
                    clearTimeout(this.timer);
                }

                if (immediate) {
                    removeFn(this.$el);
                } else {
                    utilities.Transition.start(this.$el, this.startProps).then(removeFn);
                }
            }

        }

    };

    function install(mytags) {
        mytags.notification.closeAll = function (group, immediate) {
            utilities.apply(document.body, function (el) {
                var notification = mytags.getComponent(el, 'notification');
                if (notification && (!group || group === notification.group)) {
                    notification.close(immediate);
                }
            });
        };
    }

    if (typeof window !== 'undefined' && window.mytags) {
        window.mytags.component('notification', Component);
    }

    return Component;

})));
