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

jest.mock("../../src/main/jre");
jest.mock("../../src/main/config");
jest.mock("../../src/main/utils");
import {menuberMock} from "menubar";
import {Paused, Synchronizing} from "../../src/constants";
import {getConfig} from "../../src/main/config";
import {
  calculateUsedVolumeHandler,
  changeStateHandler,
  installJREHandler,
  openSyncFolderHandler,
  siaRequestWalletInfoHandler,
  stopSyncAppsHandler,
  storjCreateAccountHandler,
  storjLoginHandler
} from "../../src/main/handlers";
import icons from "../../src/main/icons";
import {installJRE} from "../../src/main/jre";
import Sia from "../../src/main/sia";
import Storj from "../../src/main/storj";
import utils from "../../src/main/utils";

describe("IPC event handlers", () => {

  afterEach(() => {
    delete global.storj;
    delete global.sia;
  });

  describe("changeStateHandler", () => {

    let handler;
    beforeEach(() => {
      menuberMock.tray.setImage.mockClear();
      handler = changeStateHandler(menuberMock, null, null);
    });

    it("sets the idle icon when the state is Synchronizing", async () => {
      await expect(handler(Synchronizing)).resolves.toEqual(Synchronizing);
      expect(menuberMock.tray.setImage).toHaveBeenCalledWith(icons.getSyncIcon());
    });

    it("sets the paused icon when the state is Paused", async () => {
      await expect(handler(Paused)).resolves.toEqual(Paused);
      expect(menuberMock.tray.setImage).toHaveBeenCalledWith(icons.getPausedIcon());
    });

    it("restart the Storj instance if exists when the new state is Synchronizing", async () => {
      global.storj = {
        start: jest.fn(),
        stdout: {
          on: jest.fn()
        }
      };
      await expect(handler(Synchronizing)).resolves.toEqual(Synchronizing);
      expect(global.storj.start).toHaveBeenCalled();
      // expect(global.storj.stdout.on).toHaveBeenCalledWith("line", expect.any(Function));
    });

    it("closes the Storj instance if exists when the new state is Paused", async () => {
      global.storj = {
        close: jest.fn(),
        stdout: {
          removeListener: jest.fn(),
        }
      };
      await expect(handler(Paused)).resolves.toEqual(Paused);
      expect(global.storj.close).toHaveBeenCalled();
      // expect(global.storj.stdout.removeListener).toHaveBeenCalledWith("line", expect.any(Function));
    });

    it("restart the Sia instance if exists when the new state is Synchronizing", async () => {
      global.sia = {
        start: jest.fn(),
        stdout: {
          on: jest.fn()
        }
      };
      await expect(handler(Synchronizing)).resolves.toEqual(Synchronizing);
      expect(global.sia.start).toHaveBeenCalled();
      // expect(global.sia.stdout.on).toHaveBeenCalledWith("line", expect.any(Function));
    });

    it("closes the Sia instance if exists when the new state is Paused", async () => {
      global.sia = {
        close: jest.fn(),
        stdout: {
          removeListener: jest.fn(),
        }
      };
      await expect(handler(Paused)).resolves.toEqual(Paused);
      expect(global.sia.close).toHaveBeenCalled();
      // expect(global.sia.stdout.removeListener).toHaveBeenCalledWith("line", expect.any(Function));
    });

  });

  describe("openSyncFolderHandler", () => {

    let handler;
    beforeEach(async () => {
      handler = openSyncFolderHandler();
      utils.openDirectory.mockReset();
    });

    it("opens the sync folder", async () => {
      const syncFolder = "/tmp";
      getConfig.mockReturnValue(Promise.resolve({
        syncFolder: syncFolder,
      }));

      await expect(handler()).resolves.not.toBeDefined();
      expect(getConfig).toHaveBeenCalled();
      expect(utils.openDirectory).toHaveBeenCalledWith(syncFolder);
    });

  });

  describe("usedVolumeHandler", () => {

    let handler;
    beforeEach(async () => {
      handler = calculateUsedVolumeHandler();
      utils.totalVolume.mockReset();
    });

    it("calculate the volume of the sync folder", async () => {
      const syncFolder = "/tmp";
      getConfig.mockReturnValue(Promise.resolve({
        syncFolder: syncFolder,
      }));

      const volume = 1234567;
      utils.totalVolume.mockReturnValue(Promise.resolve(volume));

      await expect(handler()).resolves.toEqual(volume / 1024 / 1024);
      expect(getConfig).toHaveBeenCalled();
      expect(utils.totalVolume).toHaveBeenCalledWith(syncFolder);
    });

  });

  describe("installJRE handler", () => {

    let handler;
    beforeEach(() => {
      handler = installJREHandler();
      installJRE.mockReset();
    });

    it("installs JRE and returns the if the installation succeeds", async () => {
      const res = true;
      installJRE.mockReturnValue(Promise.resolve(res));
      await expect(handler()).resolves.toEqual(res);
      expect(installJRE).toHaveBeenCalledWith();
    });

    it("installs JRE and returns a rejected promise with an error messages if the installation fails", async () => {
      const err = "expected error";
      installJRE.mockReturnValue(Promise.reject(err));
      await expect(handler()).rejects.toEqual(err);
      expect(installJRE).toHaveBeenCalledWith();
    });

  });

  describe("siaRequestWalletInfo handler", () => {

    const address = "0x01234567890";
    const seed = "hello world";
    const dir = "/tmp";
    let handler, wallet, start;
    beforeEach(() => {
      handler = siaRequestWalletInfoHandler();
      getConfig.mockReset();
      getConfig.mockReturnValue(Promise.resolve({
        syncFolder: dir
      }));
      wallet = jest.spyOn(Sia.prototype, "wallet").mockReturnValue(Promise.resolve({
        "wallet address": address,
        "primary seed": seed,
      }));
      start = jest.spyOn(Sia.prototype, "start").mockImplementation(() => {
      });
    });

    afterEach(() => {
      wallet.mockRestore();
      start.mockRestore();
      delete global.sia;
    });

    it("creates a sia instance, calls the wallet method of the sia instance, and returns the result", async () => {
      expect(global.sia).not.toBeDefined();
      await expect(handler()).resolves.toEqual({
        address: address,
        seed: seed,
      });
      expect(global.sia).toBeDefined();
      expect(wallet).toHaveBeenCalledWith();
    });

    it("reuses the sia instance, calls the wallet method of the sia instance if a sia instance exists", async () => {
      const sia = new Sia();
      global.sia = sia;
      await expect(handler()).resolves.toEqual({
        address: address,
        seed: seed,
      });
      expect(global.sia).toBe(sia);
      expect(wallet).toHaveBeenCalledWith();
    });

    it("starts the sync sia app with reset option", async () => {
      await handler();
      expect(getConfig).toHaveBeenCalled();
      expect(start).toHaveBeenCalledWith(dir, true);
      expect(global.sia instanceof Sia).toBeTruthy();
    });

    it("returns a rejected promise with the error message when the wallet command returns an error", async () => {
      const error = "expected error";
      wallet.mockReturnValue(Promise.reject(error));
      await expect(handler()).rejects.toEqual(error);
      expect(start).not.toHaveBeenCalled();
    });

  });

  describe("stopSyncApps handler", () => {

    let handler;
    beforeEach(() => {
      handler = stopSyncAppsHandler();
    });

    it("calls storj.close and deletes global.storj if exists", async () => {
      const close = jest.fn();
      global.storj = {
        close: close
      };
      await expect(handler());
      expect(close).toHaveBeenCalled();
      expect(global.storj).not.toBeDefined();
    });

    it("calls sia.close and deletes global.sia if exists", async () => {
      const close = jest.fn();
      global.sia = {
        close: close
      };
      await expect(handler());
      expect(close).toHaveBeenCalled();
      expect(global.sia).not.toBeDefined();
    });

  });

  describe("storjLogin handler", () => {

    const email = "abc@example.com";
    const password = "password";
    const key = "xxx xxx xxx";
    const dir = "/tmp";
    beforeAll(() => {
      getConfig.mockReturnValue(Promise.resolve({
        syncFolder: dir
      }));
    });

    let handler, start, checkMnemonic, login;
    beforeEach(() => {
      handler = storjLoginHandler();
      start = jest.spyOn(Storj.prototype, "start").mockImplementation(() => {
        if (global.storj) {
          global.storj.proc = "a dummy storj instance";
        }
      });
      checkMnemonic = jest.spyOn(Storj.prototype, "checkMnemonic").mockReturnValue(Promise.resolve());
      login = jest.spyOn(Storj.prototype, "login").mockReturnValue(Promise.resolve());
      getConfig.mockClear();
    });

    afterEach(() => {
      start.mockRestore();
      checkMnemonic.mockRestore();
      login.mockRestore();
    });

    it("starts a Storj instance with reset option and calls checkMnemonic and login methods", async () => {
      expect(global.storj).not.toBeDefined();
      await expect(handler({
        email: email,
        password: password,
        encryptionKey: key,
      })).resolves.not.toBeDefined();
      expect(global.storj).toBeDefined();
      expect(getConfig).toHaveBeenCalled();
      expect(start).toHaveBeenCalledWith(dir, true);
      expect(checkMnemonic).toHaveBeenCalledWith(key);
      expect(login).toHaveBeenCalledWith(email, password, key);
    });

    it("closes the Storj instance if exists before starting a new Storj instance", async () => {
      const close = jest.fn().mockReturnValue(Promise.resolve());
      global.storj = new Storj();
      global.storj.proc = {};
      global.storj.close = close;

      await expect(handler({
        email: email,
        password: password,
        encryptionKey: key,
      })).resolves.not.toBeDefined();
      expect(close).toHaveBeenCalled();
      expect(global.storj).toBeDefined();
      expect(getConfig).toHaveBeenCalled();
      expect(start).toHaveBeenCalledWith(dir, true);
      expect(checkMnemonic).toHaveBeenCalledWith(key);
      expect(login).toHaveBeenCalledWith(email, password, key);
    });

    it("returns an error message if checkMnemonic fails", async () => {
      const err = "expected error";
      checkMnemonic.mockReturnValue(Promise.reject(err));

      await expect(handler({
        email: email,
        password: password,
        encryptionKey: key,
      })).rejects.toEqual({
        error: err,
        email: false,
        password: false,
        encryptionKey: true,
      });
      expect(start).toHaveBeenCalledWith(dir, true);
      expect(checkMnemonic).toHaveBeenCalledWith(key);
      expect(login).not.toHaveBeenCalledWith(email, password, key);
    });

    it("returns an error message if login fails", async () => {
      const err = "expected error";
      login.mockReturnValue(Promise.reject(err));

      await expect(handler({
        email: email,
        password: password,
        encryptionKey: key,
      })).rejects.toEqual({
        error: err,
        email: true,
        password: true,
        encryptionKey: false,
      });
      expect(start).toHaveBeenCalledWith(dir, true);
      expect(checkMnemonic).toHaveBeenCalledWith(key);
      expect(login).toHaveBeenCalledWith(email, password, key);
    });

  });

  describe("storjCreateAccount handler", () => {

    const email = "abc@example.com";
    const password = "password";
    const key = "xxx xxx xxx";
    const dir = "/tmp";
    beforeAll(() => {
      getConfig.mockReturnValue(Promise.resolve({
        syncFolder: dir
      }));
    });

    let handler, start, createAccount;
    beforeEach(() => {
      handler = storjCreateAccountHandler();
      start = jest.spyOn(Storj.prototype, "start").mockImplementation(() => {
        if (global.storj) {
          global.storj.proc = "a dummy storj instance";
        }
      });
      createAccount = jest.spyOn(Storj.prototype, "createAccount").mockReturnValue(Promise.resolve(key));
      getConfig.mockClear();
    });

    afterEach(() => {
      start.mockRestore();
      createAccount.mockRestore();
    });

    it("starts Storj instance with reset option, calls createAccount method, and returns a key", async () => {
      expect(global.storj).not.toBeDefined();
      await expect(handler({
        email: email,
        password: password,
      })).resolves.toEqual(key);
      expect(global.storj).toBeDefined();
      expect(getConfig).toHaveBeenCalled();
      expect(start).toHaveBeenCalledWith(dir, true);
      expect(createAccount).toHaveBeenCalledWith(email, password);
    });

    it("closes the Storj instance if exists before starting a new Storj instance", async () => {
      const close = jest.fn().mockReturnValue(Promise.resolve());
      global.storj = new Storj();
      global.storj.proc = {};
      global.storj.close = close;

      await expect(handler({
        email: email,
        password: password,
      })).resolves.toEqual(key);
      expect(close).toHaveBeenCalled();
      expect(global.storj).toBeDefined();
      expect(getConfig).toHaveBeenCalled();
      expect(start).toHaveBeenCalledWith(dir, true);
      expect(createAccount).toHaveBeenCalledWith(email, password);
    });

    it("returns an error message when creating an account fails", async () => {
      const err = "expected error";
      createAccount.mockReturnValue(Promise.reject(err));

      await expect(handler({
        email: email,
        password: password,
      })).rejects.toEqual(err);
      expect(start).toHaveBeenCalledWith(dir, true);
      expect(createAccount).toHaveBeenCalledWith(email, password);
    });

  });

});