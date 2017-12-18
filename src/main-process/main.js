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
import os from "os";
import path from "path";
import semver from "semver";
import {app, Menu} from "electron";
import menubar from "menubar";


let idleIcon, syncIcon;

if (process.platform === 'darwin') {
  // mac
  idleIcon = path.join(__dirname, "../../resources/mac/idle.png");
  syncIcon = path.join(__dirname, "../../resources/mac/sync.png");
} else {

  // windows
  let version = os.release();
  if (version.split('.').length === 2) {
    version += '.0';
  }

  if (semver.satisfies(version, '<6.2')) {
    // windows7 or older.
    idleIcon = path.join(__dirname, "../../resources/win7/idle.png");
    syncIcon = path.join(__dirname, "../../resources/win7/sync.png");
  } else {
    // windows8 or later.
    idleIcon = path.join(__dirname, "../../resources/win/idle.png");
    syncIcon = path.join(__dirname, "../../resources/win/sync.png");
  }

}


const mb = menubar({
  index: "file://" + path.join(__dirname, "../../static/popup.html"),
  icon: idleIcon,
  tooltip: app.getName(),
  preloadWindow: true,
  width: 518,
  height: 400,
});

mb.on("ready", () => {

  const ctxMenu = Menu.buildFromTemplate([
    {
      label: "exit",
      click: () => app.quit()
    }
  ]);

  mb.tray.on("right-click", () => {
    mb.tray.popUpContextMenu(ctxMenu);
  });

});