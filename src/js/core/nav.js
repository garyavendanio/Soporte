import Accordion from './accordion';

export default {

    extends: Accordion,

    data: {
        targets: '> .x-parent',
        toggle: '> a',
        content: '> ul'
    }

};
