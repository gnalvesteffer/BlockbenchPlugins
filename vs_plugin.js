const { debug } = require('console');
const path = require('node:path');

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
        let windProp = new Property(Face, "vector4", "windMode")
        
        exportAction = new Action('exportVS', {
            name:'Export into VS Format',
            icon: 'icon',
            click: function() {
                let data = {
                    textures: {},
                    elements: []
                }
                for( let i = 0; i < Cube.all.length; i++) {
                    let c = Cube.all[i];
                    let reduced_faces = {}
                    for (const direction of ['north','east', 'south', 'west', 'up', 'down']) {
                        if(c.faces[direction]) {
                            reduced_faces[direction] = {};
                            reduced_faces[direction].texture = c.faces[direction].texture ? Texture.all.find((elem,_x,_y) => c.faces[direction].texture.toString() == elem.uuid.toString()).name : undefined;
                            reduced_faces[direction].uv =  c.faces[direction].uv;
                            reduced_faces[direction].rotation =  c.faces[direction].rotation;
                            windProp.copy(c.faces[direction], reduced_faces[direction]);
                        
                        }
                    }
                    let e = {
                        name: c.name,
                        from: c.from,
                        to: c.to,
                        faces: reduced_faces,
                        rotationX: c.rotation[0],
                        rotationY: c.rotation[1],
                        rotationZ: c.rotation[2],
                    }
                    data.elements.push(e);
                }
                console.log(Texture.all.length);
                for ( let i = 0 ; i < Texture.all.length; i++) {
                    let t = Texture.all[i];
                    data.textures[t.name] = path.posix.relative('C:/Users/Lukas/AppData/Roaming/Vintagestory/assets/survival/textures/', t.path).split('.').slice(0, -1).join('.');
                }

                console.log(data.textures);

                Blockbench.export({
                    name: Project.name,
                    type: 'json',
                    extensions: ['json'],
                    content: JSON.stringify(data,null,2),
                });
            }

        })
        MenuBar.addAction(exportAction, 'file.export');

        let traverseTree = function(parent, object_space_pos, nodes) {
            for (let i = 0 ; i < nodes.length; i++) {
                let e = nodes[i];
                let group = new Group( {
                        name: e.name + '_group',
                        stepParentName: e.stepParentName,
                        origin: e.rotationOrigin? [e.rotationOrigin[0] + object_space_pos[0],e.rotationOrigin[1] + object_space_pos[1],e.rotationOrigin[2] + object_space_pos[2]]: object_space_pos,
                        
                    })

                    group.addTo(parent).init();
                if(e.faces && (Object.keys(e.faces).length > 0)) {

                        let reduced_faces = {}
                        for (const direction of ['north','east', 'south', 'west', 'up', 'down']) {
                            if(e.faces[direction]){
                                console.log(e.faces[direction].texture.substring(1));
                                let tex = Texture.all.find((elem,i,arr) => elem.name == e.faces[direction].texture.substring(1));
                                reduced_faces[direction] = { texture: tex, uv: e.faces[direction].uv, rotation: e.faces[direction].rotation};
                                
                            }
                        }
                        let cube = new Cube({
                            name: e.name,
                            from: [e.from[0] + object_space_pos[0], e.from[1] + object_space_pos[1], e.from[2] + object_space_pos[2]],
                            to: [e.to[0] + object_space_pos[0], e.to[1] + object_space_pos[1], e.to[2] + object_space_pos[2]],
                            origin: e.rotationOrigin? [e.rotationOrigin[0] + object_space_pos[0],e.rotationOrigin[1] + object_space_pos[1],e.rotationOrigin[2] + object_space_pos[2]]: object_space_pos,
                            visibility: true,
                            shade: true,
                            faces: reduced_faces,
                            rotation: [e.rotationX || 0,e.rotationY || 0,e.rotationZ || 0],
                        }).addTo(group);
                        cube.init();
                        for (const direction of ['north','east', 'south', 'west', 'up', 'down']) {
                            if(e.faces[direction] && e.faces[direction].windMode) {
                                windProp.merge(cube.faces[direction], e.faces[direction]);
                            }
                        }
                }
                if(e.children) {
                    traverseTree(group, [e.from[0] + object_space_pos[0], e.from[1] + object_space_pos[1], e.from[2] + object_space_pos[2]], e.children);
                }
            }
        }

        importAction = new Action('importVS', {
            name:'Import from VS Format',
            icon: 'icon',
            click: function() {
                Blockbench.import({
                    type: 'json',
                    extensions: ['json'],
                }, function(files) {
                    let content = JSON.parse(files[0].content)
                    //console.log(content);

                    let texture;
                    //Texture
                    for (var t in content.textures) {
                        texture = new Texture({
                            name: t,
                            path: path.format({
                                root: 'C:/Users/Lukas/AppData/Roaming/Vintagestory/assets/survival/textures/',
                                name: content.textures[t],
                                ext: '.png',})
                        }).add().load();
                    }
                    //Cubes
                    traverseTree(null, [0,0,0], content.elements)
                });
            }

        })
        MenuBar.addAction(importAction, 'file.import');
    },
    onunload() {
        exportAction.delete();
        importAction.delete();
    }
});