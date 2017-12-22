/*
 * Copyright (C) 2017 Junpei Kawamoto
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const path = require("path");

module.exports = {
    target: "electron",
    node: {
        __dirname: false,
        __filename: false
    },
    entry: {
        "main-process/main": "./src/main-process/main.js",
        "main": "./src/main.jsx",
        "main-process/installer": "./src/main-process/installer.js",
        "installer-main": "./src/installer-main.jsx",
    },
    resolve: {
        extensions: [".js", ".jsx"]
    },
    externals: [{
        "about-window": "commonjs about-window"
    }],
    module: {
        loaders: [
            { exclude: /node_modules/, test: /\.jsx?$/, loader: "babel-loader" }
        ]
    },
    output: {
        path: path.join(__dirname, "lib"),
        filename: "[name].js"
    }
};