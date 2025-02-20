// Copyright 2025 Darkluke1111

// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
// as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied 
// warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 



const { debug } = require('console');
const path = require('node:path');

let exportAction
let importAction
let reExportAction
let debugAction

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
        let editor_backDropShapeProp = new Property(ModelProject, "string", "backDropShape", {
            exposed: false,
        })

        let xyz_to_zyx = function(r) {

            let converted = new THREE.Euler(THREE.MathUtils.degToRad(r[0]), THREE.MathUtils.degToRad(r[1]), THREE.MathUtils.degToRad(r[2]), 'XYZ').reorder('ZYX').toArray();
            let bla = [THREE.MathUtils.radToDeg(converted[0]),THREE.MathUtils.radToDeg(converted[1]),THREE.MathUtils.radToDeg(converted[2])]

            return bla;
        }

        let zyx_to_xyz = function(r) {

            let converted = new THREE.Euler(THREE.MathUtils.degToRad(r[0]), THREE.MathUtils.degToRad(r[1]), THREE.MathUtils.degToRad(r[2]), 'ZYX').reorder('XYZ').toArray();
            let bla = [THREE.MathUtils.radToDeg(converted[0]),THREE.MathUtils.radToDeg(converted[1]),THREE.MathUtils.radToDeg(converted[2])]

            return bla;
        }

        let game_path_setting = new Setting("game_path", {
            name: "Game Path",
            description: "The path to your Vintage Story game folder. This is the folder that contains the assets, mods and lib folders.",
            type: "click",
            value: Settings.get("asset_path") || process.env.VINTAGE_STORY || null,
            click() {

                new Dialog("gamePathSelect", {
                    title: "Select Game Path",
                    form: {
                        path: {
                            label: "Path to your texture folder",
                            type: "folder",
                            value: Settings.get("game_path") || process.env.VINTAGE_STORY || null,
                        }

                    },
                    onConfirm(formResult) {
                        game_path_setting.set(formResult.path);
                        Settings.save()
                    }
                }).show();

            }
        })

        let get_texture_location = function (domain, rel_path) {

            for (let base_mod_path of ["creative", "game", "survival"]) {
                let f = path.posix.format({
                    root: Settings.get("game_path") + path.sep + "assets" + path.sep + base_mod_path + path.sep + "textures" + path.sep,
                    name: rel_path,
                    ext: '.png',
                })
                let exists = fs.existsSync(f)
                if(exists) {
                    
                    return f;
                }
            }
            Blockbench.showMessageBox({
                title: "Texture file not found",
                message: `Unable to find texture ${rel_path} in the base game texture locations.`
            })
            return ""
        }


        let codecVS = new Codec("codecVS", {
            name: "Vintage Story Codec",
            extension: "json",
            remember: true,
            load_filter: {
                extensions: ["json"],
                type: 'text',
            },
            compile(options) {
                let traverseExportTree = function (parent, nodes, accu) {

                    for (let i = 0; i < nodes.length; i++) {
                        let n = nodes[i];
                        let parent_pos = parent ? parent.origin : [0, 0, 0];
                        // Node is a Group
                        if (n.children) {
                            let g = n;
                            let converted_rotation = zyx_to_xyz(g.rotation);
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
                            accu.push(e);
                            traverseExportTree(g, g.children, e.children);
                        } else { // Node is a Cube
                            let c = n;
                            let reduced_faces = {}

                            for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                                if (c.faces[direction]) {
                                    reduced_faces[direction] = {};
                                    if(c.faces[direction].texture) {
                                        let texture_name = Texture.all.find((elem, _x, _y) => c.faces[direction].texture.toString() == elem.uuid.toString()).name
                                        reduced_faces[direction].texture = "#" +  texture_name;
                                    }
                                    reduced_faces[direction].uv = c.faces[direction].uv;
                                    reduced_faces[direction].rotation = c.faces[direction].rotation;
                                    windProp.copy(c.faces[direction], reduced_faces[direction]);

                                }
                            }
                            let converted_rotation = zyx_to_xyz(c.rotation);
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

                if(Texture.all.length > 0 && Texture.all[0].uv_height) {
                    data.textureHeight = Texture.all[0].uv_height;
                }
                if(Texture.all.length > 0 && Texture.all[0].uv_height) {
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
                    textureLocationProp.copy(t, tmp);
                    data.textures[t.name] = tmp.textureLocation;

                    //path.posix.relative('C:/Users/Lukas/AppData/Roaming/Vintagestory/assets/survival/textures/', t.path).split('.').slice(0, -1).join('.');
                }

                editor_backDropShapeProp.copy(Project, data.editor);


                return JSON.stringify(data, null, 2)
            },
            parse(data, file_path, add) {
                let traverseImportTree = function (parent, object_space_pos, nodes) {
                    for (let i = 0; i < nodes.length; i++) {
                        let e = nodes[i];
                        let group;
                        //if (e.children) {
                        group = new Group({
                            name: e.name + '_group',
                            stepParentName: e.stepParentName,
                            origin: e.rotationOrigin ? [e.rotationOrigin[0] + object_space_pos[0], e.rotationOrigin[1] + object_space_pos[1], e.rotationOrigin[2] + object_space_pos[2]] : object_space_pos,
                            rotation: xyz_to_zyx([e.rotationX || 0, e.rotationY || 0, e.rotationZ || 0]),
                        })

                        group.addTo(parent).init();
                        //}
                        if (e.faces && (Object.keys(e.faces).length > 0)) {

                            let reduced_faces = {}
                            for (const direction of ['north', 'east', 'south', 'west', 'up', 'down']) {
                                if (e.faces[direction]) {
                                    let texture_name = e.faces[direction].texture ? e.faces[direction].texture.substring(1) : null;
                                    let tex = Texture.all.find((elem, i, arr) => elem.name == texture_name);
                                    reduced_faces[direction] = { texture: tex, uv: e.faces[direction].uv, rotation: e.faces[direction].rotation };

                                }
                            }
                            let rotation = [0, 0, 0] //: xyz_to_zyx([e.rotationX || 0, e.rotationY || 0, e.rotationZ || 0]);
                            let cube = new Cube({
                                name: e.name,
                                from: [e.from[0] + object_space_pos[0], e.from[1] + object_space_pos[1], e.from[2] + object_space_pos[2]],
                                to: [e.to[0] + object_space_pos[0], e.to[1] + object_space_pos[1], e.to[2] + object_space_pos[2]],
                                uv_offset: e.uv || undefined,
                                origin: e.rotationOrigin ? [e.rotationOrigin[0] + object_space_pos[0], e.rotationOrigin[1] + object_space_pos[1], e.rotationOrigin[2] + object_space_pos[2]] : object_space_pos,
                                visibility: true,
                                shade: true,
                                faces: reduced_faces,
                                rotation: rotation,
                            })

                            //if (e.children) {
                            cube.addTo(group);
                            //} else {
                            //    cube.addTo(parent);
                            //}
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

            

                //Texture
                for (var t in content.textures) {
                    // console.log(path.posix.format({
                    //     root: asset_path,
                    //     name: content.textures[t],
                    //     ext: '.png',
                    // }))
                    let texture = new Texture({
                        name: t,
                        path: get_texture_location(null, content.textures[t]),
                    })
                    if(content.textureHeight) {
                        texture.uv_height = content.textureHeight;
                    }
                    if(content.textureWidth) {
                        texture.uv_width = content.textureWidth;
                    }
                    texture.add().load();
                    let tmp = { textureLocation: content.textures[t] };
                    textureLocationProp.merge(texture, tmp);
                }
                if(content.editor) {
                    editor_backDropShapeProp.merge(Project, content.editor)
                }
                
                //Cubes
                traverseImportTree(null, [0, 0, 0], content.elements)
            },
            load(model,file, add) {
                this.parse(model,file.path,add);
            }
        })

        let formatVS = new ModelFormat("formatVS", {
            name: "Vintage Story Base Format",
            codec: codecVS,
            box_uv: false,
            optional_box_uv: false,
            single_texture: false,
            single_texture_default: false,
            per_group_texture: false,
            per_texture_uv_size: true,
            model_identifier: false,
            legacy_editable_file_name: false,
            parent_model_id: false, //Use this for backdrops? false for now
            vertex_color_ambient_occlusion: false,
            animated_textures: false, // NOt sure if supported by VS
            bone_rig: true,
            centered_grid: true,
            rotate_cubes: true,
            stretch_cubes: false,
            integer_size: false,
            meshes: false,
            texture_meshes: false,
            locators: false, // Not quite sure what that is
            rotation_limit: false,
            rotation_snap: false,
            uv_rotation: true,
            java_face_properties: false,
            select_texture_for_particles: false,
            texture_mcmeta: false,
            bone_binding_expression: false, // Revisit for animation
            animation_files: false,
            texture_folder: true,
            image_editor: false, // Setting this to true removes the object outliner?!?!
            edit_mode: true,
            paint_mode: true,
            display_mode: false, // Only some Minecraft Skin stuff it seems
            animation_mode: true,
            pose_mode: false,
            animation_controllers: true,
            box_uv_float_size: false,
            java_cube_shading_properties: false,
            cullfaces: false, // Not sure if Vintage Story supports this
            // node_name_regex: null,
            render_sides: "front", //Seems right to me but I havent tested how VS does it


        })


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
            name: 'Reexport Test',
            icon: 'icon',
            click: function () {
            }
        });
        MenuBar.addAction(reExportAction, "file");

        debugAction = new Action("printDebug", {
            name: 'Print Debug Info',
            icon: 'icon',
            click: function () {
                console.log(Outliner.selected)
            }
        });
        MenuBar.addAction(debugAction, "edit");
        Outliner.control_menu_group.push(debugAction.id);
    },
    onunload() {
        exportAction.delete();
        importAction.delete();
        reExportAction.delete();
        debugAction.delete()
    }
});