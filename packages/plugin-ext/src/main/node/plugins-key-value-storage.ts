/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable, inject } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceService } from '@theia/workspace/src/browser/workspace-service';
import { PluginPaths } from './paths/const';
import { PluginPathsServiceImpl } from './paths/plugin-paths-service';
import { KeysToAnyValues, KeysToKeysToAnyValue } from '../../common/types';

@injectable()
export class PluginsKeyValueStorage {
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;
    @inject(PluginPathsServiceImpl)
    private readonly pluginPathsService: PluginPathsServiceImpl;

    private theiaDirPath: string | undefined;

    async set(key: string, value: KeysToAnyValues, isGlobal: boolean): Promise<boolean> {
        const dataPath = await this.getDataPath(isGlobal);
        const data = this.readFromFile(dataPath);

        if (value === undefined || value === {}) {
            delete data[key];
        } else {
            data[key] = value;
        }

        this.writeToFile(dataPath, data);
        return Promise.resolve(true);
    }

    async get(key: string, isGlobal: boolean): Promise<KeysToAnyValues> {
        const dataPath = await this.getDataPath(isGlobal);
        const data = this.readFromFile(dataPath);
        return Promise.resolve(data[key]);
    }

    async getAll(isGlobal: boolean): Promise<KeysToKeysToAnyValue> {
        const dataPath = await this.getDataPath(isGlobal);
        const data = this.readFromFile(dataPath);
        return Promise.resolve(data);
    }

    private async getDataPath(isGlobal: boolean): Promise<string> {
        if (this.theiaDirPath === undefined) {
            this.theiaDirPath = await this.pluginPathsService.getTheiaDirPath();
        }

        if (isGlobal) {
            return path.join(this.theiaDirPath, PluginPaths.PLUGINS_GLOBAL_STORAGE_DIR, 'global-state.json');
        } else {
            return path.join(
                await this.pluginPathsService.provideHostStoragePath(
                    this.workspaceService.workspace!,
                    await this.workspaceService.roots
                ),
                'workspace-state.json');
        }
    }

    private readFromFile(pathToFile: string): KeysToKeysToAnyValue {
        const rawData = fs.readFileSync(pathToFile, 'utf8');
        try {
            return JSON.parse(rawData);
        } catch (error) {
            console.error('Failed to parse data from "', pathToFile, '". Reason:', error);
            return {};
        }
    }

    private writeToFile(pathToFile: string, data: KeysToKeysToAnyValue): void {
        const rawData = JSON.stringify(data);
        fs.writeFileSync(pathToFile, rawData, 'utf8');
    }

}
