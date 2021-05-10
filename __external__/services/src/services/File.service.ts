import {
  BlobSASPermissions,
  BlobSASSignatureValues,
  generateBlobSASQueryParameters,
  SASProtocol,
  SASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

import * as dotenv from "dotenv";
import * as path from "path";

import { InnovationFile } from "@domain/index";
import { Connection, getConnection } from "typeorm";
import { BaseService } from "./Base.service";

dotenv.config();

enum STORAGE_PERMISSION {
  READ = "r",
  WRITE = "w",
  ADD = "a",
  DELETE = "d",
  CREATE = "c",
}

export class FileService extends BaseService<InnovationFile> {
  private readonly connection: Connection;

  constructor(connectionName?: string) {
    super(InnovationFile, connectionName);
    this.connection = getConnection(connectionName);
  }

  private getUrl(filename: string, permissions: string) {
    const starts = new Date();
    const expires = new Date(starts.getTime() + 86400_000); // 24h

    const signatureValues: BlobSASSignatureValues = {
      protocol: SASProtocol.HttpsAndHttp,
      startsOn: starts,
      expiresOn: expires,
      permissions: BlobSASPermissions.parse(permissions),
      ipRange: undefined,
      containerName: process.env.STORAGE_CONTAINER,
      identifier: undefined,
      correlationId: undefined,
      blobName: filename,
    };

    const signature = Object.assign(signatureValues, {});

    const storageSharedKeyCredential = new StorageSharedKeyCredential(
      process.env.STORAGE_ACCOUNT,
      process.env.STORAGE_KEY
    );

    try {
      const query: SASQueryParameters = generateBlobSASQueryParameters(
        signature,
        storageSharedKeyCredential
      );
      const result = `${process.env.STORAGE_BASE_URL}/${
        process.env.STORAGE_CONTAINER
      }/${filename}?${query.toString()}`;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getUploadUrl(filename: string, innovationId: string, context?: string) {
    const innovationFile = InnovationFile.new({
      displayFileName: filename,
      innovation: innovationId,
      context,
    });
    const result = await this.create(innovationFile);
    const permissions = STORAGE_PERMISSION.CREATE + STORAGE_PERMISSION.WRITE;
    const extension = path.extname(filename);
    return {
      id: result.id,
      url: this.getUrl(`${result.id}${extension}`, permissions),
    };
  }

  getDownloadUrl(filename: string) {
    const permissions = STORAGE_PERMISSION.READ;
    return this.getUrl(filename, permissions);
  }
}
