import Component from 'component';

if (typeof window !== 'undefined' && window.mytags) {
    window.mytags.component(NAME, Component);
}

export default Component;
