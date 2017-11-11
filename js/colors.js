function Color() {
    this.int = 0;
}

Color.prototype.getInt = function() {
    return this.int;
}

Color.prototype.getRGB = function() {
    return [this.r, this.g, this.b];
}

Color.prototype.mix = function(otherColor, weight) {
    var r = this.r * (1 - weight) + otherColor.r * weight;
    var g = this.g * (1 - weight) + otherColor.g * weight;
    var b = this.b * (1 - weight) + otherColor.b * weight;
    return colorRGB(r, g, b);
}

function colorRGB(r, g, b) {
    var c = new Color();
    c.r = Math.max(0, Math.min(1, r));
    c.g = Math.max(0, Math.min(1, g));
    c.b = Math.max(0, Math.min(1, b));
    c.int = rgbToInt(c.r, c.g, c.b);
    return c;
}

function colorHSV(h, s, v) {
    var rgb = hsvToRgb(h, s, v);
    return colorRGB(rgb.r, rgb.b, rgb.g);
}

function colorInt(int) {
    var c = new Color();
    c.int = int;
    c.r = 0;
    c.g = 0;
    c.b = 0;
    return c;
}

function rgbToInt(r, g, b) {
    return ~~(Math.min(r, 1) * 255) * 256 * 256 +  ~~(Math.min(g, 1) * 255) * 256 +  ~~(Math.min(b, 1) * 255); //~~ is a faster way to floor
}

function hsvToRgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: r,
        g: g,
        b: b
    };
}