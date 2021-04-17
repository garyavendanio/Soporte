import Switcher from './switcher';
import Class from '../mixin/class';
import {hasClass} from 'utilities';

export default {

    mixins: [Class],

    extends: Switcher,

    props: {
        media: Boolean
    },

    data: {
        media: 960,
        attrItem: 'x-tab-item'
    },

    connected() {

        const cls = hasClass(this.$el, 'x-tab-left')
            ? 'x-tab-left'
            : hasClass(this.$el, 'x-tab-right')
                ? 'x-tab-right'
                : false;

        if (cls) {
            this.$create('toggle', this.$el, {cls, mode: 'media', media: this.media});
        }
    }

};
