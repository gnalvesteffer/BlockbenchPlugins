const { debug } = require('console');
const path = require('node:path');

let exportAction
let importAction
let selectAssetPathAction
let reExportAction

let asset_path;


Plugin.register('vs_plugin', {
    title: 'Vintage Story Format Support',
    icon: 'icon',
    author: 'Darkluke1111',
    description: 'Adds the Vintage Story format export/import options.',
    version: '1.0.0',
    variant: 'desktop',



    onload() {
        let windProp = new Property(Face, "vector4", "windMode")
        let textureLocationProp = new Property(Texture, "string", "textureLocation")

        let asset_path_setting = new Setting("asset_path", {
            name: "Texture Asset Path",
            type: "click",
            click() {

                let selectionDialog = new Dialog("assetPathSelect", {
                    title: "Select Asset Path",
                    form: {
                        path: {
                            label: "Path to your Vintage Story root folder",
                            type: "folder",
                            value: Settings.get("asset_path"),
                        }

                    },
                    onConfirm(formResult) {
                        console.log("Result: " + formResult.path);
                        asset_path_setting.set(formResult.path);
                        Settings.save()
                    }
                }).show();

            }
        })




        let codecVS = new Codec("codecVS", {
            name: "Vintage Story Codec",
            extension: "json",
            remember: true,
            compile(options) {
                let traverseExportTree = function (parent, nodes, accu) {

                    for (let i = 0; i < nodes.length; i++) {
                        let n = nodes[i];
                        let parent_pos = parent ? parent.origin : [0, 0, 0];
                        // Node is a Group
                        if (n.children) {
                            let g = n;
                            let e = {
                                name: g.name,
                                from: [g.origin[0] - parent_pos[0], g.origin[1] - parent_pos[1], g.origin[2] - parent_pos[2]],
                                to: [g.origin[0] - parent_pos[0], g.origin[1] - parent_pos[1], g.origin[2] - parent_pos[2]],
                                rotationOrigin: [g.origin[0] - parent_pos[0], g.origin[1] - parent_pos[1], g.origin[2] - parent_pos[2]],
                                children: []
                            }
                            accu.push(e);
                            traverseExportTree(g, g.children, e.children);
                        } else { // Node is a Cube
                            console.log("found a cube!")
                            let c = n;
                            let reduced_faces = {}
                            for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                                if (c.faces[direction]) {
                                    reduced_faces[direction] = {};
                                    reduced_faces[direction].texture = c.faces[direction].texture ? Texture.all.find((elem, _x, _y) => c.faces[direction].texture.toString() == elem.uuid.toString()).name : undefined;
                                    reduced_faces[direction].uv = c.faces[direction].uv;
                                    reduced_faces[direction].rotation = c.faces[direction].rotation;
                                    windProp.copy(c.faces[direction], reduced_faces[direction]);

                                }
                            }
                            let e = {
                                name: c.name,
                                from: [c.from[0] - parent_pos[0], c.from[1] - parent_pos[1], c.from[2] - parent_pos[2]],
                                to: [c.to[0] - parent_pos[0], c.to[1] - parent_pos[1], c.to[2] - parent_pos[2]],
                                faces: reduced_faces,
                                rotationX: c.rotation[0],
                                rotationY: c.rotation[1],
                                rotationZ: c.rotation[2],
                            }
                            accu.push(e);
                        }
                    }


                }
                let elements = [];

                //Get all nodes on top level (children of 'root')
                let top_level = [];
                console.log(Group.all.length);
                for (let i = 0; i < Group.all.length; i++) {
                    console.log(Group.all[i]);
                    if (Group.all[i].parent === 'root') {
                        top_level.push(Group.all[i]);

                    }
                }
                for (let i = 0; i < Cube.all.length; i++) {
                    if (Cube.all[i].parent === 'root') {
                        top_level.push(Cube.all[i]);

                    }
                }
                traverseExportTree(null, top_level, elements);
                let data = {
                    textures: {},
                    elements: elements
                }


                //console.log(Texture.all.length);
                for (let i = 0; i < Texture.all.length; i++) {
                    let t = Texture.all[i];
                    let tmp = {};
                    textureLocationProp.copy(t, tmp);
                    data.textures[t.name] = tmp.textureLocation;

                    //path.posix.relative('C:/Users/Lukas/AppData/Roaming/Vintagestory/assets/survival/textures/', t.path).split('.').slice(0, -1).join('.');
                }
                return JSON.stringify(data, null, 2)
            },
            parse(data, file_path, add) {
                let traverseImportTree = function (parent, object_space_pos, nodes) {
                    for (let i = 0; i < nodes.length; i++) {
                        let e = nodes[i];
                        let group;
                        if (e.children) {
                            group = new Group({
                                name: e.name + '_group',
                                stepParentName: e.stepParentName,
                                origin: e.rotationOrigin ? [e.rotationOrigin[0] + object_space_pos[0], e.rotationOrigin[1] + object_space_pos[1], e.rotationOrigin[2] + object_space_pos[2]] : object_space_pos,

                            })

                            group.addTo(parent).init();
                        }
                        if (e.faces && (Object.keys(e.faces).length > 0)) {

                            let reduced_faces = {}
                            for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                                if (e.faces[direction]) {
                                    console.log(e.faces[direction].texture.substring(1));
                                    let tex = Texture.all.find((elem, i, arr) => elem.name == e.faces[direction].texture.substring(1));
                                    reduced_faces[direction] = { texture: tex, uv: e.faces[direction].uv, rotation: e.faces[direction].rotation };

                                }
                            }
                            let cube = new Cube({
                                name: e.name,
                                from: [e.from[0] + object_space_pos[0], e.from[1] + object_space_pos[1], e.from[2] + object_space_pos[2]],
                                to: [e.to[0] + object_space_pos[0], e.to[1] + object_space_pos[1], e.to[2] + object_space_pos[2]],
                                origin: e.rotationOrigin ? [e.rotationOrigin[0] + object_space_pos[0], e.rotationOrigin[1] + object_space_pos[1], e.rotationOrigin[2] + object_space_pos[2]] : object_space_pos,
                                visibility: true,
                                shade: true,
                                faces: reduced_faces,
                                rotation: [e.rotationX || 0, e.rotationY || 0, e.rotationZ || 0],
                            })
                            if (e.children) {
                                cube.addTo(group);
                            } else {
                                cube.addTo(parent);
                            }
                            cube.init();
                            for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                                if (e.faces[direction] && e.faces[direction].windMode) {
                                    windProp.merge(cube.faces[direction], e.faces[direction]);
                                }
                            }
                        }
                        if (e.children) {
                            traverseImportTree(group, [e.from[0] + object_space_pos[0], e.from[1] + object_space_pos[1], e.from[2] + object_space_pos[2]], e.children);
                        }
                    }
                }

                let content = JSON.parse(data)
                //console.log(content);

                let texture;


                //Texture
                for (var t in content.textures) {
                    console.log(path.posix.format({
                        root: asset_path,
                        name: content.textures[t],
                        ext: '.png',
                    }))
                    texture = new Texture({
                        name: t,
                        path: path.posix.format({
                            root: Settings.get("asset_path") + path.sep,
                            name: content.textures[t],
                            ext: '.png',
                        })
                    }).add().load();
                    let tmp = { textureLocation: content.textures[t] };
                    textureLocationProp.merge(texture, tmp);
                }
                //Cubes
                traverseImportTree(null, [0, 0, 0], content.elements)
            }
        })

        let formatVS = new ModelFormat("formatVS", {
            name: "Vintage Story Base Format",
            codec: codecVS
        })

        selectAssetPathAction = new Action("selectAssetPath", {
            name: 'Select VS Asset Path',
            icon: 'icon',
            click: function () {

                let selectionDialog = new Dialog("assetPathSelect", {
                    title: "Select Asset Path",
                    form: {
                        path: {
                            label: "Path to your Vintage Story root folder",
                            type: "folder"
                        }

                    },
                    onConfirm(formResult) {
                        console.log("Result: " + formResult.path);
                        asset_path = formResult.path
                    }
                }).show();
            }
        });
        MenuBar.addAction(selectAssetPathAction, 'file');


        exportAction = new Action('exportVS', {
            name: 'Export into VS Format',
            icon: 'icon',
            click: function () {

                Blockbench.export({
                    name: Project.name,
                    type: 'json',
                    extensions: ['json'],
                    content: codecVS.compile(),
                });
            }

        })
        MenuBar.addAction(exportAction, 'file.export');



        importAction = new Action('importVS', {
            name: 'Import from VS Format',
            icon: 'icon',
            click: function () {
                Blockbench.import({
                    type: 'json',
                    extensions: ['json'],
                }, function (files) {
                    codecVS.parse(files[0].content)
                });
            }

        })
        MenuBar.addAction(importAction, 'file.import');

        reExportAction = new Action("reExport", {
            name: 'Import from VS Format',
            icon: 'icon',
            click: function () {
            }
        });
        MenuBar.addAction(reExportAction, "file");
    },
    onunload() {
        exportAction.delete();
        importAction.delete();
        selectAssetPathAction.delete();
        reExportAction.delete();
    }
});