import Class from '../mixin/class';
import {closest, css, dimensions, height, isVisible, toFloat, trigger} from 'utilities';

export default {

    mixins: [Class],

    props: {
        selContainer: String,
        selContent: String
    },

    data: {
        selContainer: '.x-modal',
        selContent: '.x-modal-dialog'
    },

    computed: {

        container({selContainer}, $el) {
            return closest($el, selContainer);
        },

        content({selContent}, $el) {
            return closest($el, selContent);
        }

    },

    connected() {
        css(this.$el, 'minHeight', 150);
    },

    update: {

        read() {

            if (!this.content || !this.container || !isVisible(this.$el)) {
                return false;
            }

            return {
                current: toFloat(css(this.$el, 'maxHeight')),
                max: Math.max(150, height(this.container) - (dimensions(this.content).height - height(this.$el)))
            };
        },

        write({current, max}) {
            css(this.$el, 'maxHeight', max);
            if (Math.round(current) !== Math.round(max)) {
                trigger(this.$el, 'resize');
            }
        },

        events: ['resize']

    }

};
