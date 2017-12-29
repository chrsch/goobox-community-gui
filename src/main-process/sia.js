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

import {execFile, spawn} from "child_process";
import yaml from "js-yaml";
import jre from "node-jre";
import path from "path";
import readline from "readline";

export default class Sia {

  constructor() {
    this.wd = path.normalize(path.join(__dirname, "../../goobox-sync-sia/bin"));
    this.cmd = path.join(this.wd, "goobox-sync-sia");
    if (process.platform === "win32") {
      this.cmd += ".bat";
    }
    this.javaHome = path.join(jre.driver(), "../../");
    this.stdin = null;
    this.stdout = null;
    this.stderr = null;
  }

  start() {

    const proc = spawn(this.cmd, {
      cwd: this.wd,
      env: {
        JAVA_HOME: this.javaHome,
      },
      windowsHide: true,
    });
    this.stdin = proc.stdin;
    this.stdout = readline.createInterface({input: proc.stdout});
    this.stderr = readline.createInterface({input: proc.stderr});
    this.proc = proc;

  }

  async close() {

    if (!this.proc) {
      return;
    }

    return new Promise(resolve => {
      this.proc.on("exit", () => {
        this.closed = true;
        resolve();
      });
      this.proc.kill("SIGTERM");
    });

  }

  async wallet() {

    return new Promise((resolve, reject) => {

      execFile(this.cmd, ["wallet"], {
        cwd: this.wd,
        env: {
          JAVA_HOME: this.javaHome,
        },
        windowsHide: true,
      }, (err, stdout) => {
        if (err) {
          reject(err);
        }
        resolve(yaml.safeLoad(stdout));
      });

    });

  }

}