import {$} from 'utilities';

export default {

    props: {
        container: Boolean
    },

    data: {
        container: true
    },

    computed: {

        container({container}) {
            return container === true && this.$container || container && $(container);
        }

    }

};
