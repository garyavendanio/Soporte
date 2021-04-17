import LightboxPanel from './lightbox-panel';
import {$$, assign, data, findIndex, isElement, on, parseOptions, uniqueBy} from 'utilities';

export default {

    install,

    props: {toggle: String},

    data: {toggle: 'a'},

    computed: {

        toggles: {

            get({toggle}, $el) {
                return $$(toggle, $el);
            },

            watch() {
                this.hide();
            }

        }

    },

    disconnected() {
        this.hide();
    },

    events: [

        {

            name: 'click',

            delegate() {
                return `${this.toggle}:not(.x-disabled)`;
            },

            handler(e) {
                e.preventDefault();
                this.show(e.current);
            }

        }

    ],

    methods: {

        show(index) {

            const items = uniqueBy(this.toggles.map(toItem), 'source');

            if (isElement(index)) {
                const {source} = toItem(index);
                index = findIndex(items, ({source: src}) => source === src);
            }

            this.panel = this.panel || this.$create('lightboxPanel', assign({}, this.$props, {items}));

            on(this.panel.$el, 'hidden', () => this.panel = false);

            return this.panel.show(index);

        },

        hide() {

            return this.panel && this.panel.hide();

        }

    }

};

function install(TAGSX, Lightbox) {

    if (!TAGSX.lightboxPanel) {
        TAGSX.component('lightboxPanel', LightboxPanel);
    }

    assign(
        Lightbox.props,
        TAGSX.component('lightboxPanel').options.props
    );

}

function toItem(el) {

    const item = {};

    ['href', 'caption', 'type', 'poster', 'alt', 'attrs'].forEach(attr => {
        item[attr === 'href' ? 'source' : attr] = data(el, attr);
    });

    item.attrs = parseOptions(item.attrs);

    return item;
}
