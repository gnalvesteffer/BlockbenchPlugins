
const { debug } = require('console');
const path = require('node:path');
const ex = require("./export.js");
const im = require("./import.js");



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
        //Init additional Attribute Properties




        let game_path_setting = new Setting("game_path", {
            name: "Game Path",
            description: "The path to your Vintage Story game folder. This is the folder that contains the assets, mods and lib folders.",
            type: "click",
            icon: "fa-folder-plus",
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

        


        let codecVS = new Codec("codecVS", {
            name: "Vintage Story Codec",
            extension: "json",
            remember: true,
            load_filter: {
                extensions: ["json"],
                type: 'text',
            },
            compile(options) {
                return ex(options)
            },
            parse(data, file_path, add) {
                im(data, file_path, add)
            },
            load(model, file, add) {
                this.parse(model, file.path, add);
            }
        })

        let formatVS = new ModelFormat("formatVS", {
            name: "Vintage Story Base Format",
            codec: codecVS,
            icon: "fa-cookie-bite",
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
            icon: 'fa-cookie-bite',
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
            icon: 'fa-cookie-bite',
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
            icon: 'fa-flask-vial',
            click: function () {
                new Dialog("folder_select", {
                    title: "Select Folder",
                    form: {
                        select_folder: {
                            label: "Select Folder to test",
                            description: "This Action is made for testing. If you don't know what it does, you probably should not use it.",
                            type: "folder",
                        }
                    },
                    onConfirm(form_result) {
                        let test_folder = form_result.select_folder;

                        let test_files = fs.readdirSync(test_folder);
                        for(var test_file of test_files) {
                            if(!test_file.includes("reexport")) {
                                let project = new ModelProject({format: formatVS})
                                project.select()
                                try {
                                    let content = fs.readFileSync(test_folder + path.sep + test_file);
                                    console.log("Importing " + test_file)
                                    codecVS.parse(content, test_folder + path.sep + test_file, false);
                                    console.log("Exporting " + test_file)
                                    let reexport_content = codecVS.compile()
                                    fs.writeFileSync(test_folder + path.sep  + "reexport_" + path.basename(test_file), reexport_content)
                                    //fs.writeFileSync(test_folder + path.sep  + "diff_" + path.basename(test_file), jsonDiff.diffString(JSON.parse(content),JSON.parse(reexport_content), { precision: 3}))
                                } catch(e) {
                                    console.error(e);
                                }
                                project.close(true)
                            }
                        }
                    }
                }).show();

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