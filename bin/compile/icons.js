function plugin(mytags) {

    if (plugin.installed) {
        return;
    }

    mytags.icon.add(ICONS);

}

if (typeof window !== 'undefined' && window.mytags) {
    window.mytags.use(plugin);
}

export default plugin;
