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

import log from "electron-log";
import os from "os";
import path from "path";
import semver from "semver";

let idleIcon, syncIcon, pausedIcon, errorIcon;
if (process.platform === 'darwin') {

  // mac
  idleIcon = path.join(__dirname, "../../resources/mac/idle.png");
  syncIcon = path.join(__dirname, "../../resources/mac/sync.png");
  pausedIcon = path.join(__dirname, "../../resources/mac/paused.png");
  errorIcon = path.join(__dirname, "../../resources/mac/error.png");

} else {

  // windows
  let version = os.release();
  if (version.split('.').length === 2) {
    version += '.0';
  }

  if (semver.satisfies(version, '<6.2')) {
    // windows7 or older.
    idleIcon = path.join(__dirname, "../../resources/win/idle.png");
    syncIcon = path.join(__dirname, "../../resources/win/sync.png");
    pausedIcon = path.join(__dirname, "../../resources/win/paused.png");
    errorIcon = path.join(__dirname, "../../resources/win/error.png");
  } else {
    // windows8 or later.
    idleIcon = path.join(__dirname, "../../resources/win/idle.png");
    syncIcon = path.join(__dirname, "../../resources/win/sync.png");
    pausedIcon = path.join(__dirname, "../../resources/win/paused.png");
    errorIcon = path.join(__dirname, "../../resources/win/error.png");
  }

}

log.debug(`idle icon path: ${idleIcon}`);
log.debug(`sync icon path: ${syncIcon}`);
log.debug(`paused icon path: ${pausedIcon}`);
log.debug(`error icon path: ${errorIcon}`);

export const icons = {
  getIdleIcon: () => idleIcon,
  getSyncIcon: () => syncIcon,
  getPausedIcon: () => pausedIcon,
  getErrorIcon: () => errorIcon,
};
export default icons;