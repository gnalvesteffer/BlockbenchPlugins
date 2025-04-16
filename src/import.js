const util = require("./util.js")
const props = require("./property.js")

module.exports = function (data, path, asHologram) {

    let traverseImportTree = function (parent, object_space_pos, nodes) {
        for (let i = 0; i < nodes.length; i++) {
            let e = nodes[i];
    
            // Check if the node represents a single cube with no children
            if (e.faces && Object.keys(e.faces).length > 0 && !e.children) {
                // Create a cube directly without a group
                let reduced_faces = {};
                for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                    if (e.faces[direction]) {
                        let texture_name = e.faces[direction].texture ? e.faces[direction].texture.substring(1) : null;
                        let tex = Texture.all.find((elem) => elem.name == texture_name);
                        reduced_faces[direction] = { texture: tex, uv: e.faces[direction].uv, rotation: e.faces[direction].rotation };
                    }
                }
                let cube = new Cube({
                    name: e.name,
                    from: util.vector_add(e.from, object_space_pos),
                    to: util.vector_add(e.to, object_space_pos),
                    uv_offset: e.uv || undefined,
                    origin: e.rotationOrigin ? util.vector_add(e.rotationOrigin, object_space_pos) : object_space_pos,
                    visibility: true,
                    shade: true,
                    faces: reduced_faces,
                    rotation: [0, 0, 0],
                });
    
                if (asHologram) {
                    cube.hologram = path;
                }
    
                // Add cube directly to the parent
                cube.addTo(parent).init();
    
                // Apply windMode properties
                for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                    if (e.faces[direction] && e.faces[direction].windMode) {
                        props.windProp.merge(cube.faces[direction], e.faces[direction]);
                    }
                }
            } else {
                // Create a group for nodes with children or other properties requiring a group
                let group = new Group({
                    name: e.name.endsWith('_group') ? e.name : e.name + '_group',
                    origin: e.rotationOrigin ? util.vector_add(e.rotationOrigin, object_space_pos) : object_space_pos,
                    rotation: util.xyz_to_zyx([e.rotationX || 0, e.rotationY || 0, e.rotationZ || 0]),
                });
    
                if (asHologram) {
                    group.hologram = path;
                }
    
                if (e.stepParentName) {
                    props.stepParentProp.merge(group, e);
                }
    
                group.addTo(parent).init();
    
                // Handle cubes within the group
                if (e.faces && Object.keys(e.faces).length > 0) {
                    let reduced_faces = {};
                    for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                        if (e.faces[direction]) {
                            let texture_name = e.faces[direction].texture ? e.faces[direction].texture.substring(1) : null;
                            let tex = Texture.all.find((elem) => elem.name == texture_name);
                            reduced_faces[direction] = { texture: tex, uv: e.faces[direction].uv, rotation: e.faces[direction].rotation };
                        }
                    }
                    let cube = new Cube({
                        name: e.name,
                        from: util.vector_add(e.from, object_space_pos),
                        to: util.vector_add(e.to, object_space_pos),
                        uv_offset: e.uv || undefined,
                        origin: e.rotationOrigin ? util.vector_add(e.rotationOrigin, object_space_pos) : object_space_pos,
                        visibility: true,
                        shade: true,
                        faces: reduced_faces,
                        rotation: [0, 0, 0],
                    });
    
                    if (asHologram) {
                        cube.hologram = path;
                    }
    
                    cube.addTo(group).init();
    
                    for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                        if (e.faces[direction] && e.faces[direction].windMode) {
                            props.windProp.merge(cube.faces[direction], e.faces[direction]);
                        }
                    }
                }
    
                // Recursively process children
                if (e.children) {
                    traverseImportTree(group, util.vector_add(e.from, object_space_pos), e.children);
                }
            }
        }
    };

    let content = autoParseJSON(data)

    if (content.textureHeight) {
        Project.texture_height = content.textureHeight;
    }
    if (content.textureWidth) {
        Project.texture_width = content.textureWidth;
    }


    //Texture
    for (var t in content.textures) {
        // console.log(path.posix.format({
        //     root: asset_path,
        //     name: content.textures[t],
        //     ext: '.png',
        // }))
        let texture = new Texture({
            name: t,
            path: util.get_texture_location(null, content.textures[t]),

        })
        if (content.textureSizes && content.textureSizes[t]) {
            texture.uv_width = content.textureSizes[t][0]
            texture.uv_height = content.textureSizes[t][1]
        }
        texture.add().load();
        let tmp = { textureLocation: content.textures[t] };
        props.textureLocationProp.merge(texture, tmp);
    }

    if (content.editor) {
        if(content.editor.backDropShape) {
            props.editor_backDropShapeProp.merge(Project, content.editor)            
        }
        if(content.editor.allAngles) {
            props.editor_allAnglesProp.merge(Project, content.editor)
        }
        if(content.editor.entityTextureMode) {
            props.editor_entityTextureModeProp.merge(Project, content.editor)
        }

        if(content.editor.collapsedPaths) {
            props.editor_collapsedPathsProp.merge(Project, content.editor)
        }
    }



    //Cubes
    let group = traverseImportTree(null, [0, 0, 0], content.elements)
    //group.extend({locked: locked});

}