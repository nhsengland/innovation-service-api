import {
  BlobClient,
  BlobSASPermissions,
  BlobSASSignatureValues,
  generateBlobSASQueryParameters,
  SASProtocol,
  SASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { InnovationFile } from "@domain/index";
import * as dotenv from "dotenv";
import * as path from "path";
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
    const expires = new Date(starts.getTime() + 900_000); // 15min

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
      displayFileName: filename,
      url: this.getUrl(`${result.id}${extension}`, permissions),
    };
  }

  getDownloadUrl(id: string, filename: string) {
    const permissions = STORAGE_PERMISSION.READ;
    const extension = path.extname(filename);

    return this.getUrl(`${id}${extension}`, permissions);
  }

  async deleteFile(file: InnovationFile) {
    try {
      await this.repository.softDelete({ id: file.id });
    } catch (error) {
      throw error;
    }

    try {
      const extension = path.extname(file.displayFileName);
      const url = `${process.env.STORAGE_BASE_URL}/${process.env.STORAGE_CONTAINER}/${file.id}${extension}`;
      const storageSharedKeyCredential = new StorageSharedKeyCredential(
        process.env.STORAGE_ACCOUNT,
        process.env.STORAGE_KEY
      );
      const blobClient = new BlobClient(url, storageSharedKeyCredential);
      const response = await blobClient.deleteIfExists({
        deleteSnapshots: "include",
      });

      if (response.errorCode) {
        throw new Error(
          `Failed to delete the file ${file.displayFileName} with errorCode: ${response.errorCode}`
        );
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteFiles(files: InnovationFile[]) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await this.deleteFile(file);
    }
  }
}
