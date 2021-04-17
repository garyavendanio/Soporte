function plugin(TAGSX) {

    if (plugin.installed) {
        return;
    }

    TAGSX.icon.add(ICONS);

}

if (typeof window !== 'undefined' && window.TAGSX) {
    window.TAGSX.use(plugin);
}

export default plugin;
