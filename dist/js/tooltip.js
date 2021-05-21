(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('utilities')) :
    typeof define === 'function' && define.amd ? define('mytagstooltip', ['utilities'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.mytagsTooltip = factory(global.mytags.util));
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

    var Togglable = {

        props: {
            cls: Boolean,
            animation: 'list',
            duration: Number,
            origin: String,
            transition: String
        },

        data: {
            cls: false,
            animation: [false],
            duration: 200,
            origin: false,
            transition: 'linear',
            clsEnter: 'x-togglabe-enter',
            clsLeave: 'x-togglabe-leave',

            initProps: {
                overflow: '',
                height: '',
                paddingTop: '',
                paddingBottom: '',
                marginTop: '',
                marginBottom: ''
            },

            hideProps: {
                overflow: 'hidden',
                height: 0,
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: 0,
                marginBottom: 0
            }

        },

        computed: {

            hasAnimation: function(ref) {
                var animation = ref.animation;

                return !!animation[0];
            },

            hasTransition: function(ref) {
                var animation = ref.animation;

                return this.hasAnimation && animation[0] === true;
            }

        },

        methods: {

            toggleElement: function(targets, toggle, animate) {
                var this$1 = this;

                return new utilities.Promise(function (resolve) { return utilities.Promise.all(utilities.toNodes(targets).map(function (el) {

                        var show = utilities.isBoolean(toggle) ? toggle : !this$1.isToggled(el);

                        if (!utilities.trigger(el, ("before" + (show ? 'show' : 'hide')), [this$1])) {
                            return utilities.Promise.reject();
                        }

                        var promise = (
                            utilities.isFunction(animate)
                                ? animate
                                : animate === false || !this$1.hasAnimation
                                ? this$1._toggle
                                : this$1.hasTransition
                                    ? toggleHeight(this$1)
                                    : toggleAnimation(this$1)
                        )(el, show);

                        var cls = show ? this$1.clsEnter : this$1.clsLeave;

                        utilities.addClass(el, cls);

                        utilities.trigger(el, show ? 'show' : 'hide', [this$1]);

                        var done = function () {
                            utilities.removeClass(el, cls);
                            utilities.trigger(el, show ? 'shown' : 'hidden', [this$1]);
                            this$1.$update(el);
                        };

                        return promise ? promise.then(done, function () {
                            utilities.removeClass(el, cls);
                            return utilities.Promise.reject();
                        }) : done();

                    })).then(resolve, utilities.noop); }
                );
            },

            isToggled: function(el) {
                if ( el === void 0 ) el = this.$el;

                return utilities.hasClass(el, this.clsEnter)
                    ? true
                    : utilities.hasClass(el, this.clsLeave)
                        ? false
                        : this.cls
                            ? utilities.hasClass(el, this.cls.split(' ')[0])
                            : !utilities.hasAttr(el, 'hidden');
            },

            _toggle: function(el, toggled) {

                if (!el) {
                    return;
                }

                toggled = Boolean(toggled);

                var changed;
                if (this.cls) {
                    changed = utilities.includes(this.cls, ' ') || toggled !== utilities.hasClass(el, this.cls);
                    changed && utilities.toggleClass(el, this.cls, utilities.includes(this.cls, ' ') ? undefined : toggled);
                } else {
                    changed = toggled === el.hidden;
                    changed && (el.hidden = !toggled);
                }

                utilities.$$('[autofocus]', el).some(function (el) { return utilities.isVisible(el) ? el.focus() || true : el.blur(); });

                if (changed) {
                    utilities.trigger(el, 'toggled', [toggled, this]);
                    this.$update(el);
                }
            }

        }

    };

    function toggleHeight(ref) {
        var isToggled = ref.isToggled;
        var duration = ref.duration;
        var initProps = ref.initProps;
        var hideProps = ref.hideProps;
        var transition = ref.transition;
        var _toggle = ref._toggle;

        return function (el, show) {

            var inProgress = utilities.Transition.inProgress(el);
            var inner = el.hasChildNodes ? utilities.toFloat(utilities.css(el.firstElementChild, 'marginTop')) + utilities.toFloat(utilities.css(el.lastElementChild, 'marginBottom')) : 0;
            var currentHeight = utilities.isVisible(el) ? utilities.height(el) + (inProgress ? 0 : inner) : 0;

            utilities.Transition.cancel(el);

            if (!isToggled(el)) {
                _toggle(el, true);
            }

            utilities.height(el, '');

            // Update child components first
            utilities.fastdom.flush();

            var endHeight = utilities.height(el) + (inProgress ? 0 : inner);
            utilities.height(el, currentHeight);

            return (show
                ? utilities.Transition.start(el, utilities.assign({}, initProps, {overflow: 'hidden', height: endHeight}), Math.round(duration * (1 - currentHeight / endHeight)), transition)
                : utilities.Transition.start(el, hideProps, Math.round(duration * (currentHeight / endHeight)), transition).then(function () { return _toggle(el, false); })
            ).then(function () { return utilities.css(el, initProps); });

        };
    }

    function toggleAnimation(cmp) {
        return function (el, show) {

            utilities.Animation.cancel(el);

            var animation = cmp.animation;
            var duration = cmp.duration;
            var _toggle = cmp._toggle;

            if (show) {
                _toggle(el, true);
                return utilities.Animation.in(el, animation[0], duration, cmp.origin);
            }

            return utilities.Animation.out(el, animation[1] || animation[0], duration, cmp.origin).then(function () { return _toggle(el, false); });
        };
    }

    var Position = {

        props: {
            pos: String,
            offset: null,
            flip: Boolean,
            clsPos: String
        },

        data: {
            pos: ("bottom-" + (!utilities.isRtl ? 'left' : 'right')),
            flip: true,
            offset: false,
            clsPos: ''
        },

        computed: {

            pos: function(ref) {
                var pos = ref.pos;

                return (pos + (!utilities.includes(pos, '-') ? '-center' : '')).split('-');
            },

            dir: function() {
                return this.pos[0];
            },

            align: function() {
                return this.pos[1];
            }

        },

        methods: {

            positionAt: function(element, target, boundary) {

                utilities.removeClasses(element, ((this.clsPos) + "-(top|bottom|left|right)(-[a-z]+)?"));

                var ref = this;
                var offset = ref.offset;
                var axis = this.getAxis();

                if (!utilities.isNumeric(offset)) {
                    var node = utilities.$(offset);
                    offset = node
                        ? utilities.offset(node)[axis === 'x' ? 'left' : 'top'] - utilities.offset(target)[axis === 'x' ? 'right' : 'bottom']
                        : 0;
                }

                var ref$1 = utilities.positionAt(
                    element,
                    target,
                    axis === 'x' ? ((utilities.flipPosition(this.dir)) + " " + (this.align)) : ((this.align) + " " + (utilities.flipPosition(this.dir))),
                    axis === 'x' ? ((this.dir) + " " + (this.align)) : ((this.align) + " " + (this.dir)),
                    axis === 'x' ? ("" + (this.dir === 'left' ? -offset : offset)) : (" " + (this.dir === 'top' ? -offset : offset)),
                    null,
                    this.flip,
                    boundary
                ).target;
                var x = ref$1.x;
                var y = ref$1.y;

                this.dir = axis === 'x' ? x : y;
                this.align = axis === 'x' ? y : x;

                utilities.toggleClass(element, ((this.clsPos) + "-" + (this.dir) + "-" + (this.align)), this.offset === false);

            },

            getAxis: function() {
                return this.dir === 'top' || this.dir === 'bottom' ? 'y' : 'x';
            }

        }

    };

    var obj;

    var Component = {

        mixins: [Container, Togglable, Position],

        args: 'title',

        props: {
            delay: Number,
            title: String
        },

        data: {
            pos: 'top',
            title: '',
            delay: 0,
            animation: ['x-animation-scale-up'],
            duration: 100,
            cls: 'x-active',
            clsPos: 'x-tooltip'
        },

        beforeConnect: function() {
            this._hasTitle = utilities.hasAttr(this.$el, 'title');
            utilities.attr(this.$el, 'title', '');
            this.updateAria(false);
            makeFocusable(this.$el);
        },

        disconnected: function() {
            this.hide();
            utilities.attr(this.$el, 'title', this._hasTitle ? this.title : null);
        },

        methods: {

            show: function() {
                var this$1 = this;


                if (this.isToggled(this.tooltip) || !this.title) {
                    return;
                }

                this._unbind = utilities.once(document, ("show keydown " + utilities.pointerDown), this.hide, false, function (e) { return e.type === utilities.pointerDown && !utilities.within(e.target, this$1.$el)
                    || e.type === 'keydown' && e.keyCode === 27
                    || e.type === 'show' && e.detail[0] !== this$1 && e.detail[0].$name === this$1.$name; }
                );

                clearTimeout(this.showTimer);
                this.showTimer = setTimeout(this._show, this.delay);
            },

            hide: function() {
                var this$1 = this;


                if (utilities.matches(this.$el, 'input:focus')) {
                    return;
                }

                clearTimeout(this.showTimer);

                if (!this.isToggled(this.tooltip)) {
                    return;
                }

                this.toggleElement(this.tooltip, false, false).then(function () {
                    this$1.tooltip = utilities.remove(this$1.tooltip);
                    this$1._unbind();
                });
            },

            _show: function() {
                var this$1 = this;


                this.tooltip = utilities.append(this.container,
                    ("<div class=\"" + (this.clsPos) + "\"> <div class=\"" + (this.clsPos) + "-inner\">" + (this.title) + "</div> </div>")
                );

                utilities.on(this.tooltip, 'toggled', function (e, toggled) {

                    this$1.updateAria(toggled);

                    if (!toggled) {
                        return;
                    }

                    this$1.positionAt(this$1.tooltip, this$1.$el);

                    this$1.origin = this$1.getAxis() === 'y'
                        ? ((utilities.flipPosition(this$1.dir)) + "-" + (this$1.align))
                        : ((this$1.align) + "-" + (utilities.flipPosition(this$1.dir)));
                });

                this.toggleElement(this.tooltip, true);

            },

            updateAria: function(toggled) {
                utilities.attr(this.$el, 'aria-expanded', toggled);
            }

        },

        events: ( obj = {

            focus: 'show',
            blur: 'hide'

        }, obj[(utilities.pointerEnter + " " + utilities.pointerLeave)] = function (e) {
                if (!utilities.isTouch(e)) {
                    this[e.type === utilities.pointerEnter ? 'show' : 'hide']();
                }
            }, obj[utilities.pointerDown] = function (e) {
                if (utilities.isTouch(e)) {
                    this.show();
                }
            }, obj )

    };

    function makeFocusable(el) {
        if (!isFocusable(el)) {
            utilities.attr(el, 'tabindex', '0');
        }
    }

    function isFocusable(el) {
        return utilities.isInput(el) || utilities.matches(el, 'a,button') || utilities.hasAttr(el, 'tabindex');
    }

    if (typeof window !== 'undefined' && window.mytags) {
        window.mytags.component('tooltip', Component);
    }

    return Component;

})));
