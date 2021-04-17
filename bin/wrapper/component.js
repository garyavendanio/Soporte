import Component from 'component';

if (typeof window !== 'undefined' && window.TAGSX) {
    window.TAGSX.component(NAME, Component);
}

export default Component;
