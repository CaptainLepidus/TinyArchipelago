"use strict";
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
const RIGHT = 0, UP = 1, LEFT = 2, DOWN = 3;
const BORDER_LINES = [
    [1, 0, 1, 1],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
    [0, 1, 1, 1]
]
const DIRECTION_OFFSETS = [
    vec2(1, 0),
    vec2(0, -1),
    vec2(-1, 0),
    vec2(0, 1)
]
const VIEW_MODES = [
    {
        name: "Biomes",
        renderBackground: false
    },
    {
        name: "Continents",
        renderBackground: false
    },
    {
        name: "Height",
        renderBackground: true
    },
    {
        name: "Temperature",
        renderBackground: true
    },
    {
        name: "Salinity",
        renderBackground: true
    },
    {
        name: "Suitability",
        renderBackground: false
    }
]
const VIEW_MODE_BIOME = 0
const VIEW_MODE_CONTINENT = 1
const VIEW_MODE_HEIGHT = 2
const VIEW_MODE_HEAT = 3
const VIEW_MODE_SALT = 4
const VIEW_MODE_SUITABILITY = 5

// Makes a function ramp up slowly
function rampUp(x) {
    return Math.sqrt(x);
    return Math.pow(2 * x, 3) / 8;
}

function octaveNoise(pos, octaves) {
    var val = 0;
    var pow = 1;
    for(var i = 0; i < octaves; i++) {
        val += noise.simplex2(pos.x / pow, pos.y / pow) / pow;
        pow *= 2;
    }
    val = Math.max(-1, Math.min(1, val));
    return val;
}

// // Load them google fonts before starting...!
window.WebFontConfig = {
    google: {
        families: ['Slabo 27px']
    },

    active: function() {
        // do something
        generate();
    }
};

// include the web-font loader script
(function() {
    var wf = document.createElement('script');
    wf.src = ('https:' === document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();

function print(message) {
    console.log(message);
}

var renderer, stage, viewer;

function generate () {    
    
    //Create the renderer
    var renderOptions = {
        antialias: false
    };
    renderer = PIXI.autoDetectRenderer(480, 480, renderOptions);
    renderer.backgroundColor = 0xffffff;
    renderer.view.style.border = "1px solid black";

    //Add the canvas to the HTML document
    document.getElementById("map").appendChild(renderer.view);

    viewer = {
        stage: new PIXI.Container(),
        viewMode: 0,
        renderBorders: true,
        timers: {
            generate: 0,
            render: 0
        },
        text: new PIXI.Text("", {
            fill: "white",
            fontFamily: "Slabo 27px",
            fontSize: 20,
            stroke: "black",
            strokeThickness: 2,
        }),
        tileInspector: document.getElementById("tileInspector"),
        world: null,
        init: function() {
            this.world = new World(vec2(240), vec2(2), 0.7);
            this.stage.addChild(this.world.getContainer());
            this.inspectTile(null);
            var controls = document.getElementById("controls");
            var HTML = "";
            HTML += "<div class='controlTab'>";
            HTML += "<b>View Modes: </b>";
            for(var i = 0; i < VIEW_MODES.length; i++) {
                HTML += "<button onclick='viewer.setViewMode("+i+");'>" + VIEW_MODES[i].name + "</button>";
            }
            HTML += "</div>";
            HTML += "<div class='controlTab'>";            
            HTML += "<span class='sliderWrapper'>Sea Level: <input type='range' min='1' max='100' class='slider' id='seaLevel' value="+this.world.seaLevel*100+" ></input></span>";
            HTML += "<span class='sliderWrapper'>Global Temperature: <input type='range' min='0' max='100' class='slider' id='globalTemperature' value="+this.world.globalTemperature*100+" ></input></span>";
            HTML += "<button id='generate' onclick='viewer.generate();'>Generate New Map</button> ";
            HTML += "</div>";
            controls.innerHTML = HTML;
        },
        render: function() {
            var time = performance.now();
            this.stage.removeChild(this.text);
            this.world.render();
            renderer.render(this.stage);
            this.timers.render = performance.now() - time;
            var text = "View Mode: " + VIEW_MODES[this.viewMode].name + " ";
            switch (this.viewMode) {
                case VIEW_MODE_BIOME:
                    text += "(" + this.world.biomes.length + ")";
                break;
                case VIEW_MODE_CONTINENT:
                    text += "(" + this.world.continents.length + ")";
                break;
            }
            text += "\n";
            text += "Generated in: " + Math.floor(this.timers.generate) / 1000 + "s. "
            text += "Rendered in: " + Math.floor(this.timers.render) / 1000 + "s. ";
            this.text.text = text;
            this.stage.addChild(this.text);
            renderer.render(this.stage);
        },
        inspectTile: function(tile) {
            var list = [], html, i;
            if (tile !== null) {
                list.push("<b>" + tile.position.x + "," + tile.position.y + "</b>");
                if (tile.continent !== null) {
                    list.push("Continent: " + tile.continent.name);
                }
                list.push("Biome: " + this.world.biomes[tile.biome].name);
                list.push("Height: " + tile.height);
                list.push("Temperature: " + tile.temperature);
                html = "<ul>";
                for(i = 0; i < list.length; i++) {
                    html += "<li>" + list[i] + "</li>";
                }
                html += "</ul>";
            } else {
                html = "Click on a tile to inspect it.";
            }
            this.tileInspector.innerHTML = html;
        },
        setViewMode: function(viewMode) {
            if (this.viewMode === viewMode) {
                return false;
            }
            this.viewMode = viewMode;
            this.render();
            return true;
        },
        generate: function() {
            var seaLevel = document.getElementById("seaLevel"), globalTemperature = document.getElementById("globalTemperature");
            this.world.seaLevel = seaLevel.value/100;
            this.world.globalTemperature = globalTemperature.value/100;
            this.world.makeBiomes();
            this.world.generate();
            this.render();
            this.inspectTile(null);
        }
    }

    viewer.init();

    viewer.render();
}