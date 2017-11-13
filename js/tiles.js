"use strict";
function Tile(world, position) {
    this.position = position;
    this.world = world;
    this.borders = new Array(BORDER_LINES.length);
    this.scale = this.world.scale;

    this.container = new PIXI.Graphics();
    this.container.position = v2Multiply(this.position, this.scale);

    this.changedProperties = {}; // for automata
}

// declarations on the prototype are faster
Tile.prototype.continent = null;
Tile.prototype.bordersChanged = false;

Tile.prototype.generate = function() {
    this.continent = null;
    var dist = v2DistSquared(this.position, this.world.center) / this.world.maxDistSquared;
    var noiseVal = (octaveNoise(v2Divide(this.position, vec2(16)), 4) + 1) / 2;
    this.height = noiseVal * 0.6 + Math.pow(1 - dist, 3) * 0.4;
    this.height = Math.floor(this.height * 1000) / 1000; // only keep 3 decimal places
    var noiseVal2 = (octaveNoise(v2Divide(v2Add(this.position, v2Multiply(this.world.size, vec2(2))), vec2(128)), 1) + 1) / 2;
    var distFromSeaLevel = this.height - this.world.seaLevel;
    this.temperature = this.world.globalTemperature + noiseVal2 * 0.5 - distFromSeaLevel * 2.5;
    this.temperature = Math.max(0, Math.min(1, this.temperature)); // keep within [0,1]
    this.temperature = Math.floor(this.temperature * 1000) / 1000; // only keep 3 decimal places
    this.salinity = 0;
    if (this.height < this.world.seaLevel) {
        this.salinity = 1;
    }
    this.calculateBiome();
}

Tile.prototype.automataProcess = function(recompute) {
    var property, changed;
    changed = false;
    if (this.changedProperties.salinity !== undefined && this.changedProperties.salinity !== this.salinity) {
        this.salinity = this.changedProperties.salinity;
        changed = true;
    }
    this.changedProperties = {};
    if (recompute) {
        this.calculateBiome();
        this.calculateBorders();
    }
    return changed;
}

Tile.prototype.automataDeposition = function() {
    var offset;
    this.changedProperties.salinity = this.salinity;
    for (var i = 0; i < DIRECTION_OFFSETS.length; i++) {
        var offset = DIRECTION_OFFSETS[i];
        if (this.changedProperties.salinity >= 1) {
            this.changedProperties.salinity = 1;
            return;
        }
        var neighbor = this.world.getTile(v2Add(this.position, offset));
        if (neighbor !== null) {
            this.changedProperties.salinity = Math.min(this.changedProperties.salinity + neighbor.salinity / 5, 1);
        }
    }
}

Tile.prototype.calculateBiome = function() {
    for(var i = 0; i < this.world.biomes.length; i++) {
        var b = this.world.biomes[i];
        if (this.height >= b.minHeight && this.height < b.maxHeight && this.temperature >= b.minTemperature && this.temperature < b.maxTemperature) {
            if (b.maxSalinity === undefined || this.salinity < b.maxSalinity) {
                this.biome = i;
                this.calculateSuitability();
                return;
            }
        }
    }
    print("WE SHOULD NEVER GET THIS FAR!");
    print(this);
}

// calculates the suitability for human settlement
Tile.prototype.calculateSuitability = function() {
    if (this.continent === null) {
        this.suitability = 0;
        return;
    }
    this.suitability = 0.5; // average
    this.suitability += this.continent.tiles.length / this.world.continents[0].tiles.length * 0.5;
    this.suitability -= this.salinity;
    var temperatureExtremity = Math.abs(this.temperature - 0.4);
    this.suitability -= temperatureExtremity;
    this.suitability = Math.max(0, this.suitability);
}

Tile.prototype.calculateBorders = function() {
    var newBorder, submerged, pos, tile, i;
    submerged = this.height < this.world.seaLevel;
    for(i = 0; i < this.borders.length; i++) {
        newBorder = false;
        pos = v2Add(this.position, DIRECTION_OFFSETS[i]);
        tile = this.world.getTile(pos);
        if (tile !== null && viewer.renderBorders) {
            if (submerged !== (tile.height < this.world.seaLevel)) {
                newBorder = true;
            }
        }
        if (newBorder !== this.borders[i]) {
            this.borders[i] = newBorder;
            this.bordersChanged = true;
        }
    }
}

Tile.prototype.render = function() {
    var col, i, d;
    
    if (VIEW_MODES[viewer.viewMode].renderBackground === false && this.world.biomes[this.biome].isBackground) {
        this.container.visible = false;
        return;
    }    

    this.container.visible = true;
    if (this.bordersChanged) {
        this.container.clear();

        if (!false) {
            this.container.beginFill(0xffffff);
            this.container.drawRect(0, 0, this.scale.x, this.scale.y);
            this.container.endFill();
        }

        this.container.lineStyle(1, 0x000000, 1);
        for(i = 0; i < this.borders.length; i++) {
            if (this.borders[i] === true) {
                var line = BORDER_LINES[i];
                this.container.moveTo(line[0] * this.scale.x, line[1] * this.scale.y);
                this.container.lineTo(line[2] * this.scale.x, line[3] * this.scale.y);
            }
        }
        this.bordersChanged = false;
    }
    
    if (viewer.viewMode === VIEW_MODE_CONTINENT && this.continent !== null) {
        col = this.continent.color;
    } else if (viewer.viewMode === VIEW_MODE_HEIGHT) {
        col = colorRGB(this.height, this.height, this.height);
    } else if (viewer.viewMode === VIEW_MODE_HEAT) {
        d = this.temperature - 0.5;
        col = colorRGB(Math.max(d, 0) * 2, (0.5 - Math.abs(d)) * 2, Math.max(-d, 0) * 2);
    } else if (viewer.viewMode === VIEW_MODE_SALT) {
        col = colorRGB(this.salinity, this.salinity, this.salinity);
    } else if (viewer.viewMode === VIEW_MODE_SUITABILITY) {
        col = colorRGB(this.suitability, this.suitability, this.suitability)
    } else {
        col = this.world.biomes[this.biome].color;
    }
    this.container.tint = col.getInt();
}

Tile.prototype.getContainer = function() {
    return this.container;
}