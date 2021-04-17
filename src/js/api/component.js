import {$$, assign, camelize, fastdom, hyphenate, isPlainObject, memoize, startsWith} from 'utilities';

export default function (TAGSX) {

    const DATA = TAGSX.data;

    const components = {};

    TAGSX.component = function (name, options) {

        const id = hyphenate(name);

        name = camelize(id);

        if (!options) {

            if (isPlainObject(components[name])) {
                components[name] = TAGSX.extend(components[name]);
            }

            return components[name];

        }

        TAGSX[name] = function (element, data) {

            const component = TAGSX.component(name);

            return component.options.functional
                ? new component({data: isPlainObject(element) ? element : [...arguments]})
                : !element ? init(element) : $$(element).map(init)[0];

            function init(element) {

                const instance = TAGSX.getComponent(element, name);

                if (instance) {
                    if (!data) {
                        return instance;
                    } else {
                        instance.$destroy();
                    }
                }

                return new component({el: element, data});

            }

        };

        const opt = isPlainObject(options) ? assign({}, options) : options.options;

        opt.name = name;

        if (opt.install) {
            opt.install(TAGSX, opt, name);
        }

        if (TAGSX._initialized && !opt.functional) {
            fastdom.read(() => TAGSX[name](`[x-${id}],[data-x-${id}]`));
        }

        return components[name] = isPlainObject(options) ? opt : options;
    };

    TAGSX.getComponents = element => element && element[DATA] || {};
    TAGSX.getComponent = (element, name) => TAGSX.getComponents(element)[name];

    TAGSX.connect = node => {

        if (node[DATA]) {
            for (const name in node[DATA]) {
                node[DATA][name]._callConnected();
            }
        }

        for (let i = 0; i < node.attributes.length; i++) {

            const name = getComponentName(node.attributes[i].name);

            if (name && name in components) {
                TAGSX[name](node);
            }

        }

    };

    TAGSX.disconnect = node => {
        for (const name in node[DATA]) {
            node[DATA][name]._callDisconnected();
        }
    };

}

export const getComponentName = memoize(attribute => {
    return startsWith(attribute, 'x-') || startsWith(attribute, 'data-x-')
        ? camelize(attribute.replace('data-x-', '').replace('x-', ''))
        : false;
});
