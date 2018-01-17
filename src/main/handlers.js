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


import {dialog} from "electron";
import log from "electron-log";
import {Synchronizing} from "../constants";
import {getConfig} from "./config";
import icons from "./icons";
import {installJRE} from "./jre";
import Sia from "./sia";
import Storj from "./storj";
import utils from "./utils";

// Handlers for the main app.
export const changeStateHandler = (mb, storjEventHandler, siaEventHandler) => async payload => {
  if (payload === Synchronizing) {
    if (global.storj) {
      global.storj.start();
      global.storj.stdout.on("line", storjEventHandler);
    }
    if (global.sia) {
      global.sia.start();
      global.sia.stdout.on("line", siaEventHandler);
    }
    log.debug("Update the tray icon to the idle icon");
    mb.tray.setImage(icons.getSyncIcon());
  } else {
    if (global.storj) {
      global.storj.stdout.removeListener("line", storjEventHandler);
      await global.storj.close();
    }
    if (global.sia) {
      global.sia.stdout.removeListener("line", siaEventHandler);
      await global.sia.close();
    }
    log.debug("Update the tray icon to the paused icon");
    mb.tray.setImage(icons.getPausedIcon());
  }
  return payload;
};

export const openSyncFolderHandler = () => async () => {
  const cfg = await getConfig();
  log.info(`Open sync folder ${cfg.syncFolder}`);
  utils.openDirectory(cfg.syncFolder);
};

export const calculateUsedVolumeHandler = () => async () => {
  const cfg = await getConfig();
  const volume = await utils.totalVolume(cfg.syncFolder);
  log.info(`Calculating volume size of ${cfg.syncFolder}: ${volume / 1024 / 1024}GB`);
  return volume / 1024 / 1024;
};

// Handlers for the installer.
export const installJREHandler = () => async () => {
  return await installJRE();
};

export const siaRequestWalletInfoHandler = () => async () => {

  if (!global.sia) {
    global.sia = new Sia();
  }
  try {
    const res = await global.sia.wallet();
    const cfg = await getConfig();
    global.sia.start(cfg.syncFolder, true);
    return {
      address: res["wallet address"],
      seed: res["primary seed"],
    };

  } catch (error) {
    log.error(error);
    // TODO: Disable showing the dialog box after implementing error message in the installation screen.
    dialog.showErrorBox("Goobox", `Failed to obtain sia wallet information: ${error}`);
    delete global.sia;
    throw error;
  }

};

export const stopSyncAppsHandler = () => async () => {
  if (global.storj) {
    await global.storj.close();
    delete global.storj;
  }
  if (global.sia) {
    await global.sia.close();
    delete global.sia;
  }
};


export const storjLoginHandler = () => async payload => {

  log.info(`logging in to Storj: ${payload.email}`);
  if (global.storj && global.storj.proc) {
    await global.storj.close();
  }
  const cfg = await getConfig();
  global.storj = new Storj();
  global.storj.start(cfg.syncFolder, true);

  try {
    await global.storj.checkMnemonic(payload.encryptionKey);
  } catch (err) {
    log.error(err);
    throw {
      error: err,
      email: false,
      password: false,
      encryptionKey: true,
    };
  }

  try {
    await global.storj.login(payload.email, payload.password, payload.encryptionKey);
  } catch (err) {
    log.error(err);
    throw {
      error: err,
      email: true,
      password: true,
      encryptionKey: false,
    };
  }

};

export const storjCreateAccountHandler = () => async payload => {
  log.info(`creating a new Storj account for ${payload.email}`);
  if (global.storj && global.storj.proc) {
    await global.storj.close();
  }
  const cfg = await getConfig();
  global.storj = new Storj();
  global.storj.start(cfg.syncFolder, true);
  return await global.storj.createAccount(payload.email, payload.password);
};
