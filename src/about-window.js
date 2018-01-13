/*
 * Copyright (C) 2017-2018 Junpei Kawamoto
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

import openAboutWindow from "about-window";
import path from "path";

export default async function showInfoWindowAsync() {
  return new Promise(resolve => {
    // noinspection SpellCheckingInspection
    const about = openAboutWindow({
      icon_path: path.join(__dirname, "../resources/goobox.svg"),
      package_json_dir: path.join(__dirname, ".."),
      win_options: {
        resizable: false,
        fullscreenable: false,
        minimizable: false,
        maximizable: false
      }
    });
    about.on("closed", resolve);
  });
}
