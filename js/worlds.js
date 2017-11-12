function World(size, scale, seaLevel) {
    this.size = size;
    this.scale = scale;
    this.dimensions = v2Multiply(this.size, this.scale);
    this.seaLevel = seaLevel;
    this.globalTemperature = 0.5;
    this.continents = [];
    this.uncheckedTiles = [];
    this.tileSelected = null;
    this.created = false;

    this.center = v2Multiply(this.size, vec2(0.5));
    this.maxDistSquared = v2DistSquared(vec2(), this.center);

    this.container = new PIXI.Container();
    this.container.world = this;
    this.container.interactive = true;
    this.container.hitArea = new PIXI.Rectangle(0, 0, this.dimensions.x, this.dimensions.y);
    this.container.buttonMode = true;
    this.container
        .on("pointermove", this.pointerMove)
        .on("pointerout", this.pointerOut)
        .on("pointerdown", this.pointerDown);

    this.background = new PIXI.Graphics();
    this.background.beginFill(0xffffff, 1);
    this.background.drawRect(0, 0, this.dimensions.x, this.dimensions.y);
    this.background.endFill();
    this.container.addChild(this.background);

    this.makeBiomes(); // sets up our biome variables

    this.create(); // fills the world with an empty array of tiles

    this.generate(); // actually randomizes the world

    this.render();
}

World.prototype.makeBiomes = function() {
    this.biomes = [
        {
            name: "Deep Ocean",
            color: colorInt(0x0484d1),
            isBackground: true,
            water: true,
            minHeight: 0.0,
            maxHeight: this.seaLevel * 0.8,
            minTemperature: 0.0,
            maxTemperature: 1.1
        },
        {
            name: "Shallow Waters",
            color: colorInt(0x2ce8f4),
            water: true,
            minHeight: this.seaLevel * 0.8,
            maxHeight: this.seaLevel,
            minTemperature: 0.0,
            maxTemperature: 1.1
        },
        {
            name: "Grass",
            color: colorInt(0x63c64d),
            water: false,
            minHeight: this.seaLevel,
            maxHeight: 1.1,
            minTemperature: 0.2,
            maxTemperature: 0.6,
            maxSalinity: 0.2 // grass can't grow in salty areas - creates beaches
        },
        {
            name: "Snow",
            color: colorInt(0xffffff),
            water: false,
            minHeight: this.seaLevel,
            maxHeight: 1.1, // no maximum
            minTemperature: 0.0,
            maxTemperature: 0.05
        },
        {
            name: "Tundra",
            color: colorInt(0xafbfd2),
            water: false,
            minHeight: this.seaLevel,
            maxHeight: 1.1,
            minTemperature: 0.05,
            maxTemperature: 0.2
        },
        {
            name: "Desert",
            color: colorInt(0xffe762),
            water: false,
            minHeight: this.seaLevel,
            maxHeight: 1.1,
            minTemperature: 0.6,
            maxTemperature: 1.1,
            maxSalinity: 0.2
        },
        {
            name: "Beach",
            color: colorInt(0xffe762),
            water: false,
            minHeight: this.seaLevel,
            maxHeight: 1.1,
            minTemperature: 0.0,
            maxTemperature: 1.1
        }
    ]    
}

// unused - can delete
World.prototype.destroy = function() {
    for(var i = 0; i < this.size.x; i++) {
        for (var j = 0; j < this.size.y; j++) {
            this.tiles[i][j].container.destroy(true);
            delete this.tiles[i][j];
        }
    }
    this.created = false;
}

World.prototype.create = function() {
    this.tiles = [];
    for(var i = 0; i < this.size.x; i++) {
        this.tiles[i] = [];
        for (var j = 0; j < this.size.y; j++) {
            this.tiles[i][j] = new Tile(this, vec2(i, j));
            this.container.addChild(this.tiles[i][j].getContainer());
        }
    }
    this.created = true;
}

World.prototype.generate = function() {
    var time, i, j;
    time = performance.now();
    this.seed = Math.random();
    noise.seed(this.seed);
    this.uncheckedTiles = [];
    this.continents = [];

    // generate individual tiles
    for(i = 0; i < this.size.x; i++) {
        for (j = 0; j < this.size.y; j++) {
            this.tiles[i][j].generate();
            if (this.tiles[i][j].height >= this.seaLevel) {
                this.uncheckedTiles.push(this.tiles[i][j]); // this tile will need to be assigned a continent
            }
        }
    }

    this.tilesToAssign = [];
    // Identify continents
    while (this.uncheckedTiles.length > 0) {
        var tt = this.uncheckedTiles[0];
        this.assignContinent(tt);
        // to avoid stack overflow (caused by recursion), we create a list of tiles to assign
        while (this.tilesToAssign.length > 0) {
            this.assignContinent(this.tilesToAssign[0], this.tilesToAssign[0].continent);
            this.tilesToAssign.splice(0, 1);
        }
    }
    delete this.tilesToAssign;

    this.continents.sort(function(a, b) {
        if (a.tiles.length < b.tiles.length) {
            return 1;
        }
        if (a.tiles.length > b.tiles.length) {
            return -1;
        }
        return 0;
    });

    // generate indefinitely long, aesthetically pleasing color palette for continents
    // https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
    var hue = this.seed;
    var saturation = 0.5;
    var value = 0.95;
    for(var i = 0; i < this.continents.length; i++) {
        hue += GOLDEN_RATIO_CONJUGATE;
        hue = hue % 1;
        this.continents[i].color = colorHSV(hue, saturation, value);
        this.continents[i].name = "Continent " + (i + 1);
    }

    // Cellular automata
    var iterations = 3;
    for(var i = 0; i < iterations; i++) {
        // Automata processes: salt deposition
        for(var i = 0; i < this.size.x; i++) {
            for (var j = 0; j < this.size.y; j++) {
                this.tiles[i][j].automataDeposition();
            }
        }
        // Process the results of our automata
        for(var i = 0; i < this.size.x; i++) {
            for (var j = 0; j < this.size.y; j++) {
                this.tiles[i][j].automataProcess();
            }
        }
    }

    viewer.timers.generate = performance.now() - time;
}

World.prototype.assignContinent = function(tile, continent) {
    var i, ind, neighbor;
    ind = this.uncheckedTiles.indexOf(tile);
    this.uncheckedTiles.splice(ind, 1);
    if (continent === undefined) {
        continent = new Continent(this);
    }
    continent.addTile(tile);
    for (i = 0; i < DIRECTION_OFFSETS.length; i++) {
        neighbor = this.getTile(v2Add(tile.position, DIRECTION_OFFSETS[i]));
        if (neighbor !== null && this.uncheckedTiles.includes(neighbor) && neighbor.continent === null) {
            neighbor.continent = continent;
            this.tilesToAssign.push(neighbor);
        }
    }
}

World.prototype.render = function() {
    var bgColor = this.biomes[0].color;
    if (VIEW_MODES[viewer.viewMode].renderBackground) {
        bgColor = colorRGB(0, 0, 0);
    }
    if (VIEW_MODES[viewer.viewMode].bgColor) {
        bgColor = VIEW_MODES[viewer.viewMode].bgColor;
    }
    this.background.tint = bgColor.getInt();
    for(var i = 0; i < this.size.x; i++) {
        for (var j = 0; j < this.size.y; j++) {
            this.tiles[i][j].render();
        }
    }
}

World.prototype.pointerMove = function(event) {
    var pos = event.data.getLocalPosition(this);
    var tilePos = v2Floor(v2Divide(pos, this.world.scale));
    this.world.tileSelected = this.world.getTile(tilePos);
}

World.prototype.pointerOut = function() {
    this.world.tileSelected = null;
}

World.prototype.pointerDown = function() {
    if (this.world.tileSelected !== null) {
        viewer.inspectTile(this.world.tileSelected);
    }
}

World.prototype.getContainer = function() {
    return this.container;
}

World.prototype.getTile = function(position) {
    if (position.x >= 0 && position.y >= 0 && position.x < this.size.x && position.y < this.size.y) {
        return this.tiles[position.x][position.y];
    }
    else {
        return null;
    }
}

function Continent(world) {
    this.world = world;
    this.color = null;
    this.size = 0;
    this.name = "";
    this.tiles = [];
    this.world.continents.push(this);
}

Continent.prototype.addTile = function(tile) {
    this.tiles.push(tile);
    tile.continent = this;
}