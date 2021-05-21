(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('utilities')) :
    typeof define === 'function' && define.amd ? define('mytagsfilter', ['utilities'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.mytagsFilter = factory(global.mytags.util));
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

    var Component = {

        mixins: [Animate],

        args: 'target',

        props: {
            target: Boolean,
            selActive: Boolean
        },

        data: {
            target: null,
            selActive: false,
            attrItem: 'x-filter-control',
            cls: 'x-active',
            duration: 250
        },

        computed: {

            toggles: {

                get: function(ref, $el) {
                    var attrItem = ref.attrItem;

                    return utilities.$$(("[" + attrItem + "],[data-" + attrItem + "]"), $el);
                },

                watch: function() {
                    var this$1 = this;


                    this.updateState();

                    if (this.selActive !== false) {
                        var actives = utilities.$$(this.selActive, this.$el);
                        this.toggles.forEach(function (el) { return utilities.toggleClass(el, this$1.cls, utilities.includes(actives, el)); });
                    }

                },

                immediate: true

            },

            children: {

                get: function(ref, $el) {
                    var target = ref.target;

                    return utilities.$$((target + " > *"), $el);
                },

                watch: function(list, old) {
                    if (old && !isEqualList(list, old)) {
                        this.updateState();
                    }
                },

                immediate: true

            }

        },

        events: [

            {

                name: 'click',

                delegate: function() {
                    return ("[" + (this.attrItem) + "],[data-" + (this.attrItem) + "]");
                },

                handler: function(e) {

                    e.preventDefault();
                    this.apply(e.current);

                }

            }

        ],

        methods: {

            apply: function(el) {
                var prevState = this.getState();
                var newState = mergeState(el, this.attrItem, this.getState());

                if (!isEqualState(prevState, newState)) {
                    this.setState(newState);
                }
            },

            getState: function() {
                var this$1 = this;

                return this.toggles
                    .filter(function (item) { return utilities.hasClass(item, this$1.cls); })
                    .reduce(function (state, el) { return mergeState(el, this$1.attrItem, state); }, {filter: {'': ''}, sort: []});
            },

            setState: function(state, animate) {
                var this$1 = this;
                if ( animate === void 0 ) animate = true;


                state = utilities.assign({filter: {'': ''}, sort: []}, state);

                utilities.trigger(this.$el, 'beforeFilter', [this, state]);

                this.toggles.forEach(function (el) { return utilities.toggleClass(el, this$1.cls, !!matchFilter(el, this$1.attrItem, state)); });

                utilities.Promise.all(utilities.$$(this.target, this.$el).map(function (target) {
                    var filterFn = function () {
                        applyState(state, target, utilities.children(target));
                        this$1.$update(this$1.$el);
                    };
                    return animate ? this$1.animate(filterFn, target) : filterFn();
                })).then(function () { return utilities.trigger(this$1.$el, 'afterFilter', [this$1]); });

            },

            updateState: function() {
                var this$1 = this;

                utilities.fastdom.write(function () { return this$1.setState(this$1.getState(), false); });
            }

        }

    };

    function getFilter(el, attr) {
        return utilities.parseOptions(utilities.data(el, attr), ['filter']);
    }

    function isEqualState(stateA, stateB) {
        return ['filter', 'sort'].every(function (prop) { return utilities.isEqual(stateA[prop], stateB[prop]); });
    }

    function applyState(state, target, children) {
        var selector = getSelector(state);

        children.forEach(function (el) { return utilities.css(el, 'display', selector && !utilities.matches(el, selector) ? 'none' : ''); });

        var ref = state.sort;
        var sort = ref[0];
        var order = ref[1];

        if (sort) {
            var sorted = sortItems(children, sort, order);
            if (!utilities.isEqual(sorted, children)) {
                utilities.append(target, sorted);
            }
        }
    }

    function mergeState(el, attr, state) {

        var filterBy = getFilter(el, attr);
        var filter = filterBy.filter;
        var group = filterBy.group;
        var sort = filterBy.sort;
        var order = filterBy.order; if ( order === void 0 ) order = 'asc';

        if (filter || utilities.isUndefined(sort)) {

            if (group) {

                if (filter) {
                    delete state.filter[''];
                    state.filter[group] = filter;
                } else {
                    delete state.filter[group];

                    if (utilities.isEmpty(state.filter) || '' in state.filter) {
                        state.filter = {'': filter || ''};
                    }

                }

            } else {
                state.filter = {'': filter || ''};
            }

        }

        if (!utilities.isUndefined(sort)) {
            state.sort = [sort, order];
        }

        return state;
    }

    function matchFilter(el, attr, ref) {
        var stateFilter = ref.filter; if ( stateFilter === void 0 ) stateFilter = {'': ''};
        var ref_sort = ref.sort;
        var stateSort = ref_sort[0];
        var stateOrder = ref_sort[1];


        var ref$1 = getFilter(el, attr);
        var filter = ref$1.filter; if ( filter === void 0 ) filter = '';
        var group = ref$1.group; if ( group === void 0 ) group = '';
        var sort = ref$1.sort;
        var order = ref$1.order; if ( order === void 0 ) order = 'asc';

        return utilities.isUndefined(sort)
            ? group in stateFilter && filter === stateFilter[group]
                || !filter && group && !(group in stateFilter) && !stateFilter['']
            : stateSort === sort && stateOrder === order;
    }

    function isEqualList(listA, listB) {
        return listA.length === listB.length
            && listA.every(function (el) { return ~listB.indexOf(el); });
    }

    function getSelector(ref) {
        var filter = ref.filter;

        var selector = '';
        utilities.each(filter, function (value) { return selector += value || ''; });
        return selector;
    }

    function sortItems(nodes, sort, order) {
        return utilities.assign([], nodes).sort(function (a, b) { return utilities.data(a, sort).localeCompare(utilities.data(b, sort), undefined, {numeric: true}) * (order === 'asc' || -1); });
    }

    if (typeof window !== 'undefined' && window.mytags) {
        window.mytags.component('filter', Component);
    }

    return Component;

})));
