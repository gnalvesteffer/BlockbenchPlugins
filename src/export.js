const util = require("./util.js")
const props = require("./property.js")

module.exports = function(options) {
    let traverseExportTree = function (parent, nodes, accu) {

        for (let i = 0; i < nodes.length; i++) {
            let n = nodes[i];
            let parent_pos = parent ? parent.origin : [0, 0, 0];
            // Node is a Group
            if (n.children) {
                let g = n;
                let converted_rotation = util.zyx_to_xyz(g.rotation);
                let e = {
                    name: g.name,
                    from: [g.origin[0] - parent_pos[0], g.origin[1] - parent_pos[1], g.origin[2] - parent_pos[2]],
                    to: [g.origin[0] - parent_pos[0], g.origin[1] - parent_pos[1], g.origin[2] - parent_pos[2]],
                    rotationOrigin: [g.origin[0] - parent_pos[0], g.origin[1] - parent_pos[1], g.origin[2] - parent_pos[2]],
                    rotationX: converted_rotation[0],
                    rotationY: converted_rotation[1],
                    rotationZ: converted_rotation[2],
                    children: []
                }

                //Hwy is there no better way to do this...
                let tmp = {}
                props.stepParentProp.copy(g,tmp);
                if(tmp.stepParentName) {
                    e.stepParentName = tmp.stepParentName
                }

                accu.push(e);
                traverseExportTree(g, g.children, e.children);
            } else { // Node is a Cube
                let c = n;
                let reduced_faces = {}

                for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                    if (c.faces[direction]) {
                        reduced_faces[direction] = {};
                        if (c.faces[direction].texture) {
                            let texture = Texture.all.find((elem, _x, _y) => c.faces[direction].texture.toString() == elem.uuid.toString())
                            let texture_name = texture? texture.name : "unknown";
                            reduced_faces[direction].texture = "#" + texture_name;
                        }
                        reduced_faces[direction].uv = c.faces[direction].uv;
                        reduced_faces[direction].rotation = c.faces[direction].rotation;
                        props.windProp.copy(c.faces[direction], reduced_faces[direction]);

                    }
                }
                let converted_rotation = util.zyx_to_xyz(c.rotation);
                let e = {
                    name: c.name,
                    from: [c.from[0] - parent_pos[0], c.from[1] - parent_pos[1], c.from[2] - parent_pos[2]],
                    to: [c.to[0] - parent_pos[0], c.to[1] - parent_pos[1], c.to[2] - parent_pos[2]],
                    uv: c.uv || undefined,
                    faces: reduced_faces,
                    rotationX: converted_rotation[0],
                    rotationY: converted_rotation[1],
                    rotationZ: converted_rotation[2],
                }
                accu.push(e);
            }
        }


    }

    let data = {}

    if (Texture.all.length > 0 && Texture.all[0].uv_height) {
        data.textureHeight = Texture.all[0].uv_height;
    }
    if (Texture.all.length > 0 && Texture.all[0].uv_height) {
        data.textureWidth = Texture.all[0].uv_width;
    }

    let elements = [];

    //Get all nodes on top level (children of 'root')
    let top_level = [];

    for (let i = 0; i < Group.all.length; i++) {
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
    data.elements = elements
    data.textures = {}
    data.editor = {}

    for (let i = 0; i < Texture.all.length; i++) {
        let t = Texture.all[i];
        let tmp = {};
        props.textureLocationProp.copy(t, tmp);
        data.textures[t.name] = tmp.textureLocation;

        //path.posix.relative('C:/Users/Lukas/AppData/Roaming/Vintagestory/assets/survival/textures/', t.path).split('.').slice(0, -1).join('.');
    }

    props.editor_backDropShapeProp.copy(Project, data.editor);


    return JSON.stringify(data, null, 2)
}