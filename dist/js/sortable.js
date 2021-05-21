(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('utilities')) :
    typeof define === 'function' && define.amd ? define('mytagssortable', ['utilities'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.mytagsSortable = factory(global.mytags.util));
}(this, (function (utilities) { 'use strict';

    function getRows(items) {
        return sortBy(items, 'top', 'bottom');
    }

    function sortBy(items, startProp, endProp) {

        var sorted = [[]];

        for (var i = 0; i < items.length; i++) {

            var el = items[i];

            if (!utilities.isVisible(el)) {
                continue;
            }

            var dim = getOffset(el);

            for (var j = sorted.length - 1; j >= 0; j--) {

                var current = sorted[j];

                if (!current[0]) {
                    current.push(el);
                    break;
                }

                var startDim = (void 0);
                if (current[0].offsetParent === el.offsetParent) {
                    startDim = getOffset(current[0]);
                } else {
                    dim = getOffset(el, true);
                    startDim = getOffset(current[0], true);
                }

                if (dim[startProp] >= startDim[endProp] - 1 && dim[startProp] !== startDim[startProp]) {
                    sorted.push([el]);
                    break;
                }

                if (dim[endProp] - 1 > startDim[startProp] || dim[startProp] === startDim[startProp]) {
                    current.push(el);
                    break;
                }

                if (j === 0) {
                    sorted.unshift([el]);
                    break;
                }

            }

        }

        return sorted;
    }

    function getOffset(element, offset) {
        var assign;

        if ( offset === void 0 ) offset = false;

        var offsetTop = element.offsetTop;
        var offsetLeft = element.offsetLeft;
        var offsetHeight = element.offsetHeight;
        var offsetWidth = element.offsetWidth;

        if (offset) {
            (assign = utilities.offsetPosition(element), offsetTop = assign[0], offsetLeft = assign[1]);
        }

        return {
            top: offsetTop,
            left: offsetLeft,
            bottom: offsetTop + offsetHeight,
            right: offsetLeft + offsetWidth
        };
    }

    var clsLeave = 'x-transition-leave';
    var clsEnter = 'x-transition-enter';

    function fade(action, target, duration, stagger) {
        if ( stagger === void 0 ) stagger = 0;


        var index = transitionIndex(target, true);
        var propsIn = {opacity: 1};
        var propsOut = {opacity: 0};

        var wrapIndexFn = function (fn) { return function () { return index === transitionIndex(target) ? fn() : utilities.Promise.reject(); }; };

        var leaveFn = wrapIndexFn(function () {

            utilities.addClass(target, clsLeave);

            return utilities.Promise.all(getTransitionNodes(target).map(function (child, i) { return new utilities.Promise(function (resolve) { return setTimeout(function () { return utilities.Transition.start(child, propsOut, duration / 2, 'ease').then(resolve); }, i * stagger); }
                ); }
            )).then(function () { return utilities.removeClass(target, clsLeave); });

        });

        var enterFn = wrapIndexFn(function () {

            var oldHeight = utilities.height(target);

            utilities.addClass(target, clsEnter);
            action();

            utilities.css(utilities.children(target), {opacity: 0});

            // Ensure updates have propagated
            return new utilities.Promise(function (resolve) { return requestAnimationFrame(function () {

                    var nodes = utilities.children(target);
                    var newHeight = utilities.height(target);

                    // Ensure Grid cells do not stretch when height is applied
                    utilities.css(target, 'alignContent', 'flex-start');
                    utilities.height(target, oldHeight);

                    var transitionNodes = getTransitionNodes(target);
                    utilities.css(nodes, propsOut);

                    var transitions = transitionNodes.map(function (child, i) { return new utilities.Promise(function (resolve) { return setTimeout(function () { return utilities.Transition.start(child, propsIn, duration / 2, 'ease').then(resolve); }, i * stagger); }
                        ); }
                    );

                    if (oldHeight !== newHeight) {
                        transitions.push(utilities.Transition.start(target, {height: newHeight}, duration / 2 + transitionNodes.length * stagger, 'ease'));
                    }

                    utilities.Promise.all(transitions).then(function () {
                        utilities.removeClass(target, clsEnter);
                        if (index === transitionIndex(target)) {
                            utilities.css(target, {height: '', alignContent: ''});
                            utilities.css(nodes, {opacity: ''});
                            delete target.dataset.transition;
                        }
                        resolve();
                    });
                }); }
            );
        });

        return utilities.hasClass(target, clsLeave)
            ? waitTransitionend(target).then(enterFn)
            : utilities.hasClass(target, clsEnter)
                ? waitTransitionend(target).then(leaveFn).then(enterFn)
                : leaveFn().then(enterFn);
    }

    function transitionIndex(target, next) {
        if (next) {
            target.dataset.transition = 1 + transitionIndex(target);
        }

        return utilities.toNumber(target.dataset.transition) || 0;
    }

    function waitTransitionend(target) {
        return utilities.Promise.all(utilities.children(target).filter(utilities.Transition.inProgress).map(function (el) { return new utilities.Promise(function (resolve) { return utilities.once(el, 'transitionend transitioncanceled', resolve); }); }
        ));
    }

    function getTransitionNodes(target) {
        return getRows(utilities.children(target)).reduce(function (nodes, row) { return nodes.concat(utilities.sortBy(row.filter(function (el) { return utilities.isInView(el); }), 'offsetLeft')); }, []);
    }

    function slide (action, target, duration) {

        return new utilities.Promise(function (resolve) { return requestAnimationFrame(function () {

                var nodes = utilities.children(target);

                // Get current state
                var currentProps = nodes.map(function (el) { return getProps(el, true); });
                var targetProps = utilities.css(target, ['height', 'padding']);

                // Cancel previous animations
                utilities.Transition.cancel(target);
                nodes.forEach(utilities.Transition.cancel);
                reset(target);

                // Adding, sorting, removing nodes
                action();

                // Find new nodes
                nodes = nodes.concat(utilities.children(target).filter(function (el) { return !utilities.includes(nodes, el); }));

                // Wait for update to propagate
                utilities.Promise.resolve().then(function () {

                    // Force update
                    utilities.fastdom.flush();

                    // Get new state
                    var targetPropsTo = utilities.css(target, ['height', 'padding']);
                    var ref = getTransitionProps(target, nodes, currentProps);
                    var propsTo = ref[0];
                    var propsFrom = ref[1];

                    // Reset to previous state
                    nodes.forEach(function (el, i) { return propsFrom[i] && utilities.css(el, propsFrom[i]); });
                    utilities.css(target, utilities.assign({display: 'block'}, targetProps));

                    // Start transitions on next frame
                    requestAnimationFrame(function () {

                        var transitions = nodes.map(function (el, i) { return utilities.parent(el) === target && utilities.Transition.start(el, propsTo[i], duration, 'ease'); }
                            ).concat(utilities.Transition.start(target, targetPropsTo, duration, 'ease'));

                        utilities.Promise.all(transitions).then(function () {
                            nodes.forEach(function (el, i) { return utilities.parent(el) === target && utilities.css(el, 'display', propsTo[i].opacity === 0 ? 'none' : ''); });
                            reset(target);
                        }, utilities.noop).then(resolve);

                    });
                });
            }); });
    }

    function getProps(el, opacity) {

        var zIndex = utilities.css(el, 'zIndex');

        return utilities.isVisible(el)
            ? utilities.assign({
                display: '',
                opacity: opacity ? utilities.css(el, 'opacity') : '0',
                pointerEvents: 'none',
                position: 'absolute',
                zIndex: zIndex === 'auto' ? utilities.index(el) : zIndex
            }, getPositionWithMargin(el))
            : false;
    }

    function getTransitionProps(target, nodes, currentProps) {

        var propsTo = nodes.map(function (el, i) { return utilities.parent(el) && i in currentProps
                ? currentProps[i]
                ? utilities.isVisible(el)
                    ? getPositionWithMargin(el)
                    : {opacity: 0}
                : {opacity: utilities.isVisible(el) ? 1 : 0}
                : false; });

        var propsFrom = propsTo.map(function (props, i) {

            var from = utilities.parent(nodes[i]) === target && (currentProps[i] || getProps(nodes[i]));

            if (!from) {
                return false;
            }

            if (!props) {
                delete from.opacity;
            } else if (!('opacity' in props)) {
                var opacity = from.opacity;

                if (opacity % 1) {
                    props.opacity = 1;
                } else {
                    delete from.opacity;
                }
            }

            return from;
        });

        return [propsTo, propsFrom];
    }

    function reset(el) {
        utilities.css(el.children, {
            height: '',
            left: '',
            opacity: '',
            pointerEvents: '',
            position: '',
            top: '',
            marginTop: '',
            marginLeft: '',
            transform: '',
            width: '',
            zIndex: ''
        });
        utilities.css(el, {height: '', display: '', padding: ''});
    }

    function getPositionWithMargin(el) {
        var ref = utilities.offset(el);
        var height = ref.height;
        var width = ref.width;
        var ref$1 = utilities.position(el);
        var top = ref$1.top;
        var left = ref$1.left;
        var ref$2 = utilities.css(el, ['marginTop', 'marginLeft']);
        var marginLeft = ref$2.marginLeft;
        var marginTop = ref$2.marginTop;

        return {top: top, left: left, height: height, width: width, marginLeft: marginLeft, marginTop: marginTop, transform: ''};
    }

    var Animate = {

        props: {
            duration: Number,
            animation: String
        },

        data: {
            duration: 150,
            animation: 'slide'
        },

        methods: {

            animate: function(action, target) {
                var this$1 = this;
                if ( target === void 0 ) target = this.$el;


                var name = this.animation;
                var animationFn = name === 'fade'
                    ? fade
                    : name === 'delayed-fade'
                        ? function () {
                            var args = [], len = arguments.length;
                            while ( len-- ) args[ len ] = arguments[ len ];

                            return fade.apply(void 0, args.concat( [40] ));
                }
                        : slide;

                return animationFn(action, target, this.duration)
                    .then(function () { return this$1.$update(target, 'resize'); }, utilities.noop);
            }

        }
    };

    var Class = {

        connected: function() {
            !utilities.hasClass(this.$el, this.$name) && utilities.addClass(this.$el, this.$name);
        }

    };

    var Component = {

        mixins: [Class, Animate],

        props: {
            group: String,
            threshold: Number,
            clsItem: String,
            clsPlaceholder: String,
            clsDrag: String,
            clsDragState: String,
            clsBase: String,
            clsNoDrag: String,
            clsEmpty: String,
            clsCustom: String,
            handle: String
        },

        data: {
            group: false,
            threshold: 5,
            clsItem: 'x-sortable-item',
            clsPlaceholder: 'x-sortable-placeholder',
            clsDrag: 'x-sortable-drag',
            clsDragState: 'x-drag',
            clsBase: 'x-sortable',
            clsNoDrag: 'x-sortable-nodrag',
            clsEmpty: 'x-sortable-empty',
            clsCustom: '',
            handle: false,
            pos: {}
        },

        created: function() {
            var this$1 = this;

            ['init', 'start', 'move', 'end'].forEach(function (key) {
                var fn = this$1[key];
                this$1[key] = function (e) {
                    utilities.assign(this$1.pos, utilities.getEventPos(e));
                    fn(e);
                };
            });
        },

        events: {

            name: utilities.pointerDown,
            passive: false,
            handler: 'init'

        },

        computed: {

            target: function() {
                return (this.$el.tBodies || [this.$el])[0];
            },

            items: function() {
                return utilities.children(this.target);
            },

            isEmpty: {

                get: function() {
                    return utilities.isEmpty(this.items);
                },

                watch: function(empty) {
                    utilities.toggleClass(this.target, this.clsEmpty, empty);
                },

                immediate: true

            },

            handles: {

                get: function(ref, el) {
                    var handle = ref.handle;

                    return handle ? utilities.$$(handle, el) : this.items;
                },

                watch: function(handles, prev) {
                    utilities.css(prev, {touchAction: '', userSelect: ''});
                    utilities.css(handles, {touchAction: utilities.hasTouch ? 'none' : '', userSelect: 'none'}); // touchAction set to 'none' causes a performance drop in Chrome 80
                },

                immediate: true

            }

        },

        update: {

            write: function(data) {

                if (!this.drag || !utilities.parent(this.placeholder)) {
                    return;
                }

                var ref = this;
                var ref_pos = ref.pos;
                var x = ref_pos.x;
                var y = ref_pos.y;
                var ref_origin = ref.origin;
                var offsetTop = ref_origin.offsetTop;
                var offsetLeft = ref_origin.offsetLeft;
                var placeholder = ref.placeholder;

                utilities.css(this.drag, {
                    top: y - offsetTop,
                    left: x - offsetLeft
                });

                var sortable = this.getSortable(document.elementFromPoint(x, y));

                if (!sortable) {
                    return;
                }

                var items = sortable.items;

                if (items.some(utilities.Transition.inProgress)) {
                    return;
                }

                var target = findTarget(items, {x: x, y: y});

                if (items.length && (!target || target === placeholder)) {
                    return;
                }

                var previous = this.getSortable(placeholder);
                var insertTarget = findInsertTarget(sortable.target, target, placeholder, x, y, sortable === previous && data.moved !== target);

                if (insertTarget === false) {
                    return;
                }

                if (insertTarget && placeholder === insertTarget) {
                    return;
                }

                if (sortable !== previous) {
                    previous.remove(placeholder);
                    data.moved = target;
                } else {
                    delete data.moved;
                }

                sortable.insert(placeholder, insertTarget);

                this.touched.add(sortable);
            },

            events: ['move']

        },

        methods: {

            init: function(e) {

                var target = e.target;
                var button = e.button;
                var defaultPrevented = e.defaultPrevented;
                var ref = this.items.filter(function (el) { return utilities.within(target, el); });
                var placeholder = ref[0];

                if (!placeholder
                    || defaultPrevented
                    || button > 0
                    || utilities.isInput(target)
                    || utilities.within(target, ("." + (this.clsNoDrag)))
                    || this.handle && !utilities.within(target, this.handle)
                ) {
                    return;
                }

                e.preventDefault();

                this.touched = new Set([this]);
                this.placeholder = placeholder;
                this.origin = utilities.assign({target: target, index: utilities.index(placeholder)}, this.pos);

                utilities.on(document, utilities.pointerMove, this.move);
                utilities.on(document, utilities.pointerUp, this.end);

                if (!this.threshold) {
                    this.start(e);
                }

            },

            start: function(e) {

                this.drag = appendDrag(this.$container, this.placeholder);
                var ref = this.placeholder.getBoundingClientRect();
                var left = ref.left;
                var top = ref.top;
                utilities.assign(this.origin, {offsetLeft: this.pos.x - left, offsetTop: this.pos.y - top});

                utilities.addClass(this.drag, this.clsDrag, this.clsCustom);
                utilities.addClass(this.placeholder, this.clsPlaceholder);
                utilities.addClass(this.items, this.clsItem);
                utilities.addClass(document.documentElement, this.clsDragState);

                utilities.trigger(this.$el, 'start', [this, this.placeholder]);

                trackScroll(this.pos);

                this.move(e);
            },

            move: function(e) {

                if (this.drag) {
                    this.$emit('move');
                } else if (Math.abs(this.pos.x - this.origin.x) > this.threshold || Math.abs(this.pos.y - this.origin.y) > this.threshold) {
                    this.start(e);
                }

            },

            end: function() {
                var this$1 = this;


                utilities.off(document, utilities.pointerMove, this.move);
                utilities.off(document, utilities.pointerUp, this.end);
                utilities.off(window, 'scroll', this.scroll);

                if (!this.drag) {
                    return;
                }

                untrackScroll();

                var sortable = this.getSortable(this.placeholder);

                if (this === sortable) {
                    if (this.origin.index !== utilities.index(this.placeholder)) {
                        utilities.trigger(this.$el, 'moved', [this, this.placeholder]);
                    }
                } else {
                    utilities.trigger(sortable.$el, 'added', [sortable, this.placeholder]);
                    utilities.trigger(this.$el, 'removed', [this, this.placeholder]);
                }

                utilities.trigger(this.$el, 'stop', [this, this.placeholder]);

                utilities.remove(this.drag);
                this.drag = null;

                this.touched.forEach(function (ref) {
                        var clsPlaceholder = ref.clsPlaceholder;
                        var clsItem = ref.clsItem;

                        return this$1.touched.forEach(function (sortable) { return utilities.removeClass(sortable.items, clsPlaceholder, clsItem); }
                    );
                }
                );
                this.touched = null;
                utilities.removeClass(document.documentElement, this.clsDragState);

            },

            insert: function(element, target) {
                var this$1 = this;


                utilities.addClass(this.items, this.clsItem);

                var insert = function () { return target
                    ? utilities.before(target, element)
                    : utilities.append(this$1.target, element); };

                if (this.animation) {
                    this.animate(insert);
                } else {
                    insert();
                }

            },

            remove: function(element) {

                if (!utilities.within(element, this.target)) {
                    return;
                }

                if (this.animation) {
                    this.animate(function () { return utilities.remove(element); });
                } else {
                    utilities.remove(element);
                }

            },

            getSortable: function(element) {
                do {
                    var sortable = this.$getComponent(element, 'sortable');

                    if (sortable && (sortable === this || this.group !== false && sortable.group === this.group)) {
                        return sortable;
                    }
                } while ((element = utilities.parent(element)));
            }

        }

    };

    var trackTimer;
    function trackScroll(pos) {

        var last = Date.now();
        trackTimer = setInterval(function () {

            var x = pos.x;
            var y = pos.y;
            y += window.pageYOffset;

            var dist = (Date.now() - last) * .3;
            last = Date.now();

            utilities.scrollParents(document.elementFromPoint(x, pos.y)).reverse().some(function (scrollEl) {

                var scroll = scrollEl.scrollTop;
                var scrollHeight = scrollEl.scrollHeight;

                var ref = utilities.offset(utilities.getViewport(scrollEl));
                var top = ref.top;
                var bottom = ref.bottom;
                var height = ref.height;

                if (top < y && top + 35 > y) {
                    scroll -= dist;
                } else if (bottom > y && bottom - 35 < y) {
                    scroll += dist;
                } else {
                    return;
                }

                if (scroll > 0 && scroll < scrollHeight - height) {
                    utilities.scrollTop(scrollEl, scroll);
                    return true;
                }

            });

        }, 15);

    }

    function untrackScroll() {
        clearInterval(trackTimer);
    }

    function appendDrag(container, element) {
        var clone = utilities.append(container, element.outerHTML.replace(/(^<)(?:li|tr)|(?:li|tr)(\/>$)/g, '$1div$2'));

        utilities.css(clone, 'margin', '0', 'important');
        utilities.css(clone, utilities.assign({
            boxSizing: 'border-box',
            width: element.offsetWidth,
            height: element.offsetHeight
        }, utilities.css(element, ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'])));

        utilities.height(clone.firstElementChild, utilities.height(element.firstElementChild));

        return clone;
    }

    function findTarget(items, point) {
        return items[utilities.findIndex(items, function (item) { return utilities.pointInRect(point, item.getBoundingClientRect()); })];
    }

    function findInsertTarget(list, target, placeholder, x, y, sameList) {

        if (!utilities.children(list).length) {
            return;
        }

        var rect = target.getBoundingClientRect();
        if (!sameList) {

            if (!isHorizontal(list, placeholder)) {
                return y < rect.top + rect.height / 2
                    ? target
                    : target.nextElementSibling;
            }

            return target;
        }

        var placeholderRect = placeholder.getBoundingClientRect();
        var sameRow = linesIntersect(
            [rect.top, rect.bottom],
            [placeholderRect.top, placeholderRect.bottom]
        );

        var pointerPos = sameRow ? x : y;
        var lengthProp = sameRow ? 'width' : 'height';
        var startProp = sameRow ? 'left' : 'top';
        var endProp = sameRow ? 'right' : 'bottom';

        var diff = placeholderRect[lengthProp] < rect[lengthProp] ? rect[lengthProp] - placeholderRect[lengthProp] : 0;

        if (placeholderRect[startProp] < rect[startProp]) {

            if (diff && pointerPos < rect[startProp] + diff) {
                return false;
            }

            return target.nextElementSibling;
        }

        if (diff && pointerPos > rect[endProp] - diff) {
            return false;
        }

        return target;
    }

    function isHorizontal(list, placeholder) {

        var single = utilities.children(list).length === 1;

        if (single) {
            utilities.append(list, placeholder);
        }

        var items = utilities.children(list);
        var isHorizontal = items.some(function (el, i) {
            var rectA = el.getBoundingClientRect();
            return items.slice(i + 1).some(function (el) {
                var rectB = el.getBoundingClientRect();
                return !linesIntersect([rectA.left, rectA.right], [rectB.left, rectB.right]);
            });
        });

        if (single) {
            utilities.remove(placeholder);
        }

        return isHorizontal;
    }

    function linesIntersect(lineA, lineB) {
        return lineA[1] > lineB[0] && lineB[1] > lineA[0];
    }

    if (typeof window !== 'undefined' && window.mytags) {
        window.mytags.component('sortable', Component);
    }

    return Component;

})));
