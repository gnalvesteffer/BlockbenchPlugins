const path = require("node:path");

let xyz_to_zyx = function (r) {

    let converted = new THREE.Euler(THREE.MathUtils.degToRad(r[0]), THREE.MathUtils.degToRad(r[1]), THREE.MathUtils.degToRad(r[2]), 'XYZ').reorder('ZYX').toArray();
    let bla = [THREE.MathUtils.radToDeg(converted[0]), THREE.MathUtils.radToDeg(converted[1]), THREE.MathUtils.radToDeg(converted[2])]

    return bla;
}

let zyx_to_xyz = function (r) {

    let converted = new THREE.Euler(THREE.MathUtils.degToRad(r[0]), THREE.MathUtils.degToRad(r[1]), THREE.MathUtils.degToRad(r[2]), 'ZYX').reorder('XYZ').toArray();
    let bla = [THREE.MathUtils.radToDeg(converted[0]), THREE.MathUtils.radToDeg(converted[1]), THREE.MathUtils.radToDeg(converted[2])]

    return bla;
}

let get_texture_location = function (domain, rel_path) {

    for (let base_mod_path of ["creative", "game", "survival"]) {
        let f = path.posix.format({
            root: Settings.get("game_path") + path.sep + "assets" + path.sep + base_mod_path + path.sep + "textures" + path.sep,
            name: rel_path,
            ext: '.png',
        })
        let exists = fs.existsSync(f)
        if (exists) {

            return f;
        }
    }
    return ""
}

let get_shape_location = function (domain, rel_path) {

    for (let base_mod_path of ["creative", "game", "survival"]) {
        let f = path.posix.format({
            root: Settings.get("game_path") + path.sep + "assets" + path.sep + base_mod_path + path.sep + "shapes" + path.sep,
            name: rel_path,
            ext: '.json',
        })
        console.log(f)
        let exists = fs.existsSync(f)
        if (exists) {

            return f;
        }
    }
    return ""
}

module.exports = {
    xyz_to_zyx: xyz_to_zyx,
    zyx_to_xyz: zyx_to_xyz,
    get_texture_location: get_texture_location,
    get_shape_location: get_shape_location,
}