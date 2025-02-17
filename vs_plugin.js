let exportAction
let importAction

Plugin.register('vs_plugin', {
    title: 'Vintage Story Format Support',
    icon: 'icon',
    author: 'Darkluke1111',
    description: 'Adds the Vintage Story format export/import options.',
    version: '1.0.0',
    variant: 'desktop',
    onload() {

        exportAction = new Action('exportVS', {
            name:'Export into VS Format',
            icon: 'icon',
            click: function() {
                Blockbench.export({
                    name: Project.name,
                    type: 'json',
                    extensions: ['json'],
                    content: 'TODO Exported Content'
                });
            }

        })
        MenuBar.addAction(exportAction, "file.export");

        importAction = new Action('importVS', {
            name:'Import from VS Format',
            icon: 'icon',
            click: function() {
                Blockbench.import({
                    type: 'json',
                    extensions: ['json'],
                }, function(files) {

                });
            }

        })
        MenuBar.addAction(importAction, "file.import");
    },
    onunload() {
        exportAction.delete();
        importAction.delete();
    }
});