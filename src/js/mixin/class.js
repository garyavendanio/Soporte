import {addClass, hasClass} from 'utilities';

export default {

    connected() {
        !hasClass(this.$el, this.$name) && addClass(this.$el, this.$name);
    }

};
