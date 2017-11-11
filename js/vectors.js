// vec2(x,y) [x,y]
// vec2(x): [x,x]
// vec2() [0,0]
function vec2(x, y) {
    return {
        x: (x !== undefined) ? x : 0,
        y: (y !== undefined) ? y : ((x !== undefined) ? x : 0)
    };
}

function v2Add(v1, v2) {
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y
    };
}

function v2Subtract(v1, v2) {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y
    };
}

function v2Floor(vec) {
    return {
        x: ~~vec.x,
        y: ~~vec.y
    }
}

function v2DistSquared(v1, v2) {
    return Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2);
}

function v2Multiply(v1, v2) {
    return {
        x: v1.x * v2.x,
        y: v1.y * v2.y
    };
}

function v2Divide(v1, v2) {
    return {
        x: v1.x / v2.x,
        y: v1.y / v2.y
    };
}