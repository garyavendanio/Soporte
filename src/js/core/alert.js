import Class from '../mixin/class';
import Togglable from '../mixin/togglable';
import {assign} from 'utilities';

export default {

    mixins: [Class, Togglable],

    args: 'animation',

    props: {
        close: String
    },

    data: {
        animation: [true],
        selClose: '.x-alert-close',
        duration: 150,
        hideProps: assign({opacity: 0}, Togglable.data.hideProps)
    },

    events: [

        {

            name: 'click',

            delegate() {
                return this.selClose;
            },

            handler(e) {
                e.preventDefault();
                this.close();
            }

        }

    ],

    methods: {

        close() {
            this.toggleElement(this.$el).then(() => this.$destroy(true));
        }

    }

};
