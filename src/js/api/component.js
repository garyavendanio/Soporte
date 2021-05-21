import {$$, assign, camelize, fastdom, hyphenate, isPlainObject, memoize, startsWith} from 'utilities';

export default function (mytags) {

    const DATA = mytags.data;

    const components = {};

    mytags.component = function (name, options) {

        const id = hyphenate(name);

        name = camelize(id);

        if (!options) {

            if (isPlainObject(components[name])) {
                components[name] = mytags.extend(components[name]);
            }

            return components[name];

        }

        mytags[name] = function (element, data) {

            const component = mytags.component(name);

            return component.options.functional
                ? new component({data: isPlainObject(element) ? element : [...arguments]})
                : !element ? init(element) : $$(element).map(init)[0];

            function init(element) {

                const instance = mytags.getComponent(element, name);

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
            opt.install(mytags, opt, name);
        }

        if (mytags._initialized && !opt.functional) {
            fastdom.read(() => mytags[name](`[x-${id}],[data-x-${id}]`));
        }

        return components[name] = isPlainObject(options) ? opt : options;
    };

    mytags.getComponents = element => element && element[DATA] || {};
    mytags.getComponent = (element, name) => mytags.getComponents(element)[name];

    mytags.connect = node => {

        if (node[DATA]) {
            for (const name in node[DATA]) {
                node[DATA][name]._callConnected();
            }
        }

        for (let i = 0; i < node.attributes.length; i++) {

            const name = getComponentName(node.attributes[i].name);

            if (name && name in components) {
                mytags[name](node);
            }

        }

    };

    mytags.disconnect = node => {
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
