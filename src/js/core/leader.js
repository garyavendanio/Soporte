import Class from '../mixin/class';
import Media from '../mixin/media';
import {attr, getCssVar, toggleClass, unwrap, wrapInner} from 'utilities';

export default {

    mixins: [Class, Media],

    props: {
        fill: String
    },

    data: {
        fill: '',
        clsWrapper: 'x-leader-fill',
        clsHide: 'x-leader-hide',
        attrFill: 'data-fill'
    },

    computed: {

        fill({fill}) {
            return fill || getCssVar('leader-fill-content');
        }

    },

    connected() {
        [this.rollup] = wrapInner(this.$el, `<span class="${this.clsWrapper}">`);
    },

    disconnected() {
        unwrap(this.rollup.childNodes);
    },

    update: {

        read({changed, width}) {

            const prev = width;

            width = Math.floor(this.$el.offsetWidth / 2);

            return {
                width,
                fill: this.fill,
                changed: changed || prev !== width,
                hide: !this.matchMedia
            };
        },

        write(data) {

            toggleClass(this.rollup, this.clsHide, data.hide);

            if (data.changed) {
                data.changed = false;
                attr(this.rollup, this.attrFill, new Array(data.width).join(data.fill));
            }

        },

        events: ['resize']

    }

};
