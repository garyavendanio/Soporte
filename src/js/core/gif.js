import {isInView} from 'utilities';

// Deprecated
export default {

    update: {

        read(data) {

            const inview = isInView(this.$el);

            if (!inview || data.isInView === inview) {
                return false;
            }

            data.isInView = inview;
        },

        write() {
            this.$el.src = '' + this.$el.src; // force self-assign
        },

        events: ['scroll', 'resize']
    }

};
