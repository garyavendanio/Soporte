import {$, apply, isString, mergeOptions, parents, toNode} from 'utilities';

export default function (TAGSX) {

    const DATA = TAGSX.data;

    TAGSX.use = function (plugin) {

        if (plugin.installed) {
            return;
        }

        plugin.call(null, this);
        plugin.installed = true;

        return this;
    };

    TAGSX.mixin = function (mixin, component) {
        component = (isString(component) ? TAGSX.component(component) : component) || this;
        component.options = mergeOptions(component.options, mixin);
    };

    TAGSX.extend = function (options) {

        options = options || {};

        const Super = this;
        const Sub = function TAGSXComponent(options) {
            this._init(options);
        };

        Sub.prototype = Object.create(Super.prototype);
        Sub.prototype.constructor = Sub;
        Sub.options = mergeOptions(Super.options, options);

        Sub.super = Super;
        Sub.extend = Super.extend;

        return Sub;
    };

    TAGSX.update = function (element, e) {

        element = element ? toNode(element) : document.body;

        parents(element).reverse().forEach(element => update(element[DATA], e));
        apply(element, element => update(element[DATA], e));

    };

    let container;
    Object.defineProperty(TAGSX, 'container', {

        get() {
            return container || document.body;
        },

        set(element) {
            container = $(element);
        }

    });

    function update(data, e) {

        if (!data) {
            return;
        }

        for (const name in data) {
            if (data[name]._connected) {
                data[name]._callUpdate(e);
            }
        }

    }
}
