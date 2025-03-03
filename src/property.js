
module.exports = {
    windProp: new Property(Face, "vector4", "windMode"),
    textureLocationProp: new Property(Texture, "string", "textureLocation"),
    editor_backDropShapeProp: new Property(ModelProject, "string", "backDropShape", {
        exposed: false,
    }),
    editor_allAnglesProp: new Property(ModelProject, "boolean", "allAngles", {
        exposed: false,
    }),
    editor_entityTextureModeProp: new Property(ModelProject, "boolean", "entityTextureMode", {
        exposed: false,
    }),
    editor_collapsedPathsProp: new Property(ModelProject, "string", "collapsedPaths", {
        exposed: false,
    }),
    stepParentProp: new Property(Group, "string", "stepParentName"),
    hologramGroupProp: new Property(Group, "string", "hologram"),
    hologramCubeProp: new Property(Cube, "string", "hologram"),
}