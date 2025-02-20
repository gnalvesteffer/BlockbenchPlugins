
module.exports =  {
    windProp: new Property(Face, "vector4", "windMode"),
    textureLocationProp: new Property(Texture, "string", "textureLocation"),
    editor_backDropShapeProp: new Property(ModelProject, "string", "backDropShape", {
        exposed: false,
    }),
    stepParentProp: new Property(Group, "string", "stepParentName"),
}