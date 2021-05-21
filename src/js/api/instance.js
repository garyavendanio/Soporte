import {hyphenate, isEmpty, memoize, remove, within} from 'utilities';

export default function (mytags) {

    const DATA = mytags.data;

    mytags.prototype.$create = function (component, element, data) {
        return mytags[component](element, data);
    };

    mytags.prototype.$mount = function (el) {

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

    mytags.prototype.$reset = function () {
        this._callDisconnected();
        this._callConnected();
    };

    mytags.prototype.$destroy = function (removeEl = false) {

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

    mytags.prototype.$emit = function (e) {
        this._callUpdate(e);
    };

    mytags.prototype.$update = function (element = this.$el, e) {
        mytags.update(element, e);
    };

    mytags.prototype.$getComponent = mytags.getComponent;

    const componentName = memoize(name => mytags.prefix + hyphenate(name));
    Object.defineProperties(mytags.prototype, {

        $container: Object.getOwnPropertyDescriptor(mytags, 'container'),

        $name: {

            get() {
                return componentName(this.$options.name);
            }

        }

    });

}
