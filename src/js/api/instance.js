import {hyphenate, isEmpty, memoize, remove, within} from 'utilities';

export default function (TAGSX) {

    const DATA = TAGSX.data;

    TAGSX.prototype.$create = function (component, element, data) {
        return TAGSX[component](element, data);
    };

    TAGSX.prototype.$mount = function (el) {

        const {name} = this.$options;

        if (!el[DATA]) {
            el[DATA] = {};
        }

        if (el[DATA][name]) {
            return;
        }

        el[DATA][name] = this;

        this.$el = this.$options.el = this.$options.el || el;

        if (within(el, document)) {
            this._callConnected();
        }
    };

    TAGSX.prototype.$reset = function () {
        this._callDisconnected();
        this._callConnected();
    };

    TAGSX.prototype.$destroy = function (removeEl = false) {

        const {el, name} = this.$options;

        if (el) {
            this._callDisconnected();
        }

        this._callHook('destroy');

        if (!el || !el[DATA]) {
            return;
        }

        delete el[DATA][name];

        if (!isEmpty(el[DATA])) {
            delete el[DATA];
        }

        if (removeEl) {
            remove(this.$el);
        }
    };

    TAGSX.prototype.$emit = function (e) {
        this._callUpdate(e);
    };

    TAGSX.prototype.$update = function (element = this.$el, e) {
        TAGSX.update(element, e);
    };

    TAGSX.prototype.$getComponent = TAGSX.getComponent;

    const componentName = memoize(name => TAGSX.prefix + hyphenate(name));
    Object.defineProperties(TAGSX.prototype, {

        $container: Object.getOwnPropertyDescriptor(TAGSX, 'container'),

        $name: {

            get() {
                return componentName(this.$options.name);
            }

        }

    });

}
